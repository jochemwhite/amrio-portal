"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { LoginSchema, LoginSchemaType } from "@/schemas/auth";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import generateLink from "@/server/email/generateLink";
import { sendEmail } from "@/server/email/send-email";
import { ActionResponse } from "@/types/actions";
import { redirect } from "next/navigation";
import ResetPasswordEmail from "../../emails/ResetPassword";
import { render } from "@react-email/components";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
  sameSite: "lax" as const,
};

export async function Login(
  formData: LoginSchemaType,
  redirectTo: string = "/dashboard",
): Promise<ActionResponse<null>> {
  const supabase = await createClient();

  const result = LoginSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: "Invalid email or password format." };
  }

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: mfa } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfa && mfa.nextLevel === "aal2" && mfa.nextLevel !== mfa.currentLevel) {
    redirect("/mfa");
  }

  redirect(redirectTo);
}

export async function ForgotPassword(
  email: string,
): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  try {
    // check if the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (userError) {
      if (userError.code === "PGRST116") {
        // add to audit log
        await supabaseAdmin.from("audit_logs").insert({
          event_type: "user_forgot_password",
          user_id: null,
          metadata: { email },
          ip_address: null,
          user_agent: null,
        });
        return { success: true };
      }
      return { success: false, error: userError.message };
    }

    // generate password reset link
    const { data: inviteData, error: generateLinkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
      });

    if (generateLinkError) {
      console.error("Error generating password reset link:", generateLinkError);
      return { success: false, error: generateLinkError.message };
    }

    const link = generateLink({
      next: "/password-reset",
      token: inviteData.properties.hashed_token,
      type: "recovery",
    });

    // send email
    const emailHtml = await render(
      ResetPasswordEmail({
        resetLink: link,
        userName: user.first_name || user.email,
      }),
    );

    const { success, error } = await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: "Password Reset Request",
      html: emailHtml,
    });

    if (!success) {
      return {
        success: false,
        error: error || "Failed to send password reset email",
      };
    }

    // insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "user_forgot_password",
      user_id: user.id,
      metadata: { email },
    });

    // logout user
    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    console.error(err);
    return {
      error: err instanceof Error ? err.message : "Unknown error",
      success: false,
    };
  }
}

export async function ResetPassword(
  password: string,
): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: userError?.message ?? "Unauthorized" };
    }

    const { error: passwordUpdateError } = await supabase.auth.updateUser({
      password,
    });
    if (passwordUpdateError) {
      console.error(passwordUpdateError);
      return { success: false, error: passwordUpdateError.message };
    }

    // Audit log before signing out
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "user_password_reset",
      user_id: user.id,
      metadata: {},
    });

    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    console.error(err);
    return {
      error: err instanceof Error ? err.message : "Unknown error",
      success: false,
    };
  }
}

export async function setSessionCookies({
  tenantId,
  websiteId,
  revalidate = false,
}: {
  tenantId: string | null;
  websiteId: string | null;
  revalidate?: boolean;
}) {
  const cookieStore = await cookies();

  if (tenantId) {
    cookieStore.set("active-tenant", tenantId, COOKIE_OPTIONS);
  }

  if (websiteId) {
    cookieStore.set("active-website", websiteId, COOKIE_OPTIONS);
  }

  // Revalidate the entire dashboard so all server pages re-render
  // with the new cookies — use this when switching tenant/website
  if (revalidate) {
    revalidatePath("/dashboard", "layout");
  }
}
