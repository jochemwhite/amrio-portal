"use server";

import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";

import InviteUserEmail from "../../../emails/InviteUserEmail";
import ResetPasswordEmail from "../../../emails/ResetPassword";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { UserFormValues } from "@/schemas/user-form";
import generateLink from "@/server/email/generateLink";
import { sendEmail } from "@/server/email/send-email";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { ActionResponse } from "@/types/actions";

type AuthUserMetadata = {
  pending_tenant_details?: boolean;
  tenant_id?: string;
};

async function ensureAdminAccess(): Promise<ActionResponse<null>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);

  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can manage users." };
  }

  return { success: true, data: null };
}

async function getAdminSenderName(userId: string) {
  const { data: userData, error: userDataError } = await supabaseAdmin
    .from("users")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();

  if (userDataError) {
    return {
      name: "Amrio Team",
      error: "Failed to fetch user data.",
    };
  }

  const name = [userData.first_name, userData.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    name: name || "Amrio Team",
    error: null,
  };
}

async function sendInviteEmail({
  email,
  clientName,
  adminUserId,
  tenantName,
  newTenant = false,
}: {
  email: string;
  clientName: string;
  adminUserId: string;
  tenantName?: string;
  newTenant?: boolean;
}): Promise<ActionResponse<null>> {
  const { data: inviteData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (generateLinkError) {
    console.error("Error generating invite link:", generateLinkError);
    return { success: false, error: generateLinkError.message };
  }

  const inviteLink = generateLink({
    next: "/onboarding",
    token: inviteData.properties.hashed_token,
    type: "magiclink",
  });

  const { name: invitingAdminName, error: senderError } = await getAdminSenderName(adminUserId);
  if (senderError) {
    return { success: false, error: senderError };
  }

  const emailHtml = await render(
    InviteUserEmail({
      yourName: invitingAdminName,
      setupLink: inviteLink,
      clientName,
      tenantName,
      newTenant,
    }),
  );

  const { success, error: sendError } = await sendEmail({
    to: email,
    subject: "Invite to Amrio Portal",
    text: "Invite to Amrio Portal",
    html: emailHtml,
  });

  if (!success) {
    return { success: false, error: sendError ?? "Failed to send invite email." };
  }

  return { success: true, data: null };
}

function formatInviteSetupError(message: string) {
  if (message.includes("invalid input syntax for type uuid")) {
    return "Invite setup failed because the selected global role value is invalid. Please refresh the page and try again.";
  }

  if (message.includes("function public.has_global_role(unknown) does not exist")) {
    return "Invite setup failed because the database function is misconfigured. The create_user_profile_and_assign_role function must call has_global_role(auth.uid(), 'system_admin').";
  }

  return `Failed to set up user profile and role: ${message}`;
}

function shouldDeleteAuthUserAfterRpcFailure(message: string) {
  if (
    message.includes("duplicate key value violates unique constraint")
    || message.includes("already exists")
  ) {
    return false;
  }

  return true;
}

export async function createUserInvite(userValues: UserFormValues): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  let newUserId: string | null = null;
  let tenantName: string | undefined;
  let isNewTenantInvite = false;

  try {
    const {
      data: { user: currentUser },
      error: currentUserError,
    } = await supabase.auth.getUser();

    if (currentUserError || !currentUser) {
      return { success: false, error: "Unauthorized: User not authenticated." };
    }

    const isAdmin = await checkRequiredRoles(currentUser.id, ["system_admin"]);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Only system administrators can create user invites." };
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userValues.email)
      .single();

    if (existingUserError && existingUserError.code !== "PGRST116") {
      console.error("Error checking for existing user:", existingUserError);
      return { success: false, error: "Failed to check for existing user." };
    }

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
      email: userValues.email,
    });

    if (authUserError) {
      console.error("Error creating user in auth.users:", authUserError);
      return { success: false, error: "Failed to create user in auth.users." };
    }

    const { error: rpcError } = await supabase.rpc("create_user_profile_and_assign_role", {
      p_user_id: authUser.user.id,
      p_email: userValues.email,
      p_first_name: userValues.first_name,
      p_last_name: userValues.last_name,
      p_role_type_id: userValues.global_role ?? "",
    });

    if (rpcError) {
      console.error("Error in create_user_profile_and_assign_role:", rpcError);
      if (shouldDeleteAuthUserAfterRpcFailure(rpcError.message)) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      }
      return { success: false, error: formatInviteSetupError(rpcError.message) };
    }

    newUserId = authUser.user.id;

    if (userValues.tenant_id) {
      const { data: existingTenant, error: tenantLookupError } = await supabaseAdmin
        .from("tenants")
        .select("id, name")
        .eq("id", userValues.tenant_id)
        .single();

      if (tenantLookupError || !existingTenant) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: tenantLookupError?.message ?? "Tenant not found." };
      }

      tenantName = existingTenant.name;

      const { error: membershipError } = await supabaseAdmin.from("user_tenants").insert({
        user_id: newUserId,
        tenant_id: userValues.tenant_id,
        role: userValues.tenant_role,
      });

      if (membershipError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: membershipError.message };
      }

      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(newUserId, {
        user_metadata: { pending_tenant_details: false } satisfies AuthUserMetadata,
      });

      if (metadataError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: metadataError.message };
      }
    }

    if (userValues.new_tenant) {
      isNewTenantInvite = true;

      const { data: newTenant, error: tenantInsertError } = await supabaseAdmin
        .from("tenants")
        .insert({
          name: userValues.new_tenant.name,
          business_type: userValues.new_tenant.business_type,
          contact_email: userValues.new_tenant.contact_email,
          country: userValues.new_tenant.country,
          storage_quota_bytes: 104857600,
          storage_used_bytes: 0,
          primary_contact_user_id: newUserId,
        })
        .select("id, name")
        .single();

      if (tenantInsertError || !newTenant) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: tenantInsertError?.message ?? "Failed to create tenant shell." };
      }

      tenantName = newTenant.name;

      const { error: membershipError } = await supabaseAdmin.from("user_tenants").insert({
        user_id: newUserId,
        tenant_id: newTenant.id,
        role: "admin",
      });

      if (membershipError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: membershipError.message };
      }

      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(newUserId, {
        user_metadata: {
          pending_tenant_details: true,
          tenant_id: newTenant.id,
        } satisfies AuthUserMetadata,
      });

      if (metadataError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: metadataError.message };
      }
    }

    if (userValues.no_tenant) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(newUserId, {
        user_metadata: { pending_tenant_details: false } satisfies AuthUserMetadata,
      });

      if (metadataError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return { success: false, error: metadataError.message };
      }
    }

    if (userValues.send_invite) {
      const sendInviteResult = await sendInviteEmail({
        email: userValues.email,
        clientName: userValues.first_name || userValues.email,
        adminUserId: currentUser.id,
        tenantName,
        newTenant: isNewTenantInvite,
      });

      if (!sendInviteResult.success) {
        return { success: false, error: sendInviteResult.error };
      }
    }

    revalidatePath("/dashboard/admin/users", "layout");
    revalidatePath("/dashboard", "layout");
    return { success: true, data: newUserId };
  } catch (overallError: any) {
    console.error("An unexpected error occurred in createUserInvite:", overallError);
    if (newUserId) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch((cleanUpErr) => {
        console.error("Error during cleanup of auth user:", cleanUpErr);
      });
    }
    return { success: false, error: overallError.message || "An unknown error occurred." };
  }
}

export async function resendVerificationEmail(email: string): Promise<ActionResponse<string>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
      error: currentUserError,
    } = await supabase.auth.getUser();

    if (currentUserError || !currentUser) {
      return { success: false, error: "Unauthorized: User not authenticated." };
    }

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("first_name, last_name, email")
      .eq("email", email)
      .single();

    if (userError || !userRecord) {
      return { success: false, error: userError?.message ?? "User not found." };
    }

    const sendInviteResult = await sendInviteEmail({
      email,
      clientName: userRecord.first_name || userRecord.email,
      adminUserId: currentUser.id,
    });

    if (!sendInviteResult.success) {
      return { success: false, error: sendInviteResult.error ?? "Failed to send verification email." };
    }

    return { success: true, data: "" };
  } catch (error) {
    console.error("Failed to resend verification email", error);
    return { success: false, error: "Failed to resend verification email." };
  }
}

export async function resetPasswordWithLink(email: string): Promise<ActionResponse<string>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  try {
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("first_name, last_name, email")
      .eq("email", email)
      .single();

    if (userError || !userRecord) {
      return { success: false, error: userError?.message ?? "User not found." };
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (error) return { success: false, error: error.message };

    const resetLink = generateLink({
      next: "/password-reset",
      token: data.properties.hashed_token,
      type: "recovery",
    });

    const emailHtml = await render(
      ResetPasswordEmail({
        userName: userRecord.first_name || userRecord.email,
        resetLink,
      }),
    );

    const { success, error: sendError } = await sendEmail({
      to: email,
      subject: "Reset your Amrio password",
      text: "Reset your Amrio password",
      html: emailHtml,
    });

    if (!success) {
      return { success: false, error: sendError ?? "Failed to send password reset email." };
    }

    return { success: true, data: "" };
  } catch (error) {
    console.error("Failed to generate reset password link", error);
    return { success: false, error: "Failed to generate reset password link." };
  }
}

export async function setUserPassword(
  userId: string,
  password: string,
): Promise<ActionResponse<null>> {
  const access = await ensureAdminAccess();
  if (!access.success) return { success: false, error: access.error };

  const normalizedPassword = password.trim();

  if (normalizedPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: normalizedPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to set user password", error);
    return { success: false, error: "Failed to set user password." };
  }
}
