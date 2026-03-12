"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient"; // Assumed to use SERVICE_ROLE_KEY
import { createClient } from "@/lib/supabase/supabaseServerClient"; // Assumed to use authenticated user's JWT
import { UserFormValues } from "@/schemas/user-form";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import generateLink from "@/server/email/generateLink";
import { sendEmail } from "@/server/email/send-email";
import { ActionResponse } from "@/types/actions";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import InviteUserEmail from "../../../emails/InviteUserEmail";

export async function createUserInvite(userValues: UserFormValues): Promise<ActionResponse<string>> {
  const supabase = await createClient(); // Client for user-level operations (respects RLS)
  let newUserId: string | null = null; // To store the ID of the newly created auth user for cleanup

  try {
    // 1. Authorization Check: Ensure the calling user is a system_admin
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
    if (currentUserError || !currentUser) {
      return { success: false, error: "Unauthorized: User not authenticated." };
    }

    const isAdmin = await checkRequiredRoles(currentUser.user.id, ["system_admin"]);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Only system administrators can create user invites." };
    }

    // 2. Check if the invitee user already exists in public.users
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id") // Only need ID to check existence
      .eq("email", userValues.email)
      .single();

    if (existingUserError && existingUserError.code !== "PGRST116") {
      // PGRST116 means "no rows found"
      console.error("Error checking for existing user:", existingUserError);
      return { success: false, error: "Failed to check for existing user." };
    }

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    // create user in auth.users
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
      email: userValues.email,
    });

    if (authUserError) {
      console.error("Error creating user in auth.users:", authUserError);
      return { success: false, error: "Failed to create user in auth.users." };
    }

    // call the rpc to create the user profile and assign the role
    const { error: rpcError } = await supabase.rpc("create_user_profile_and_assign_role", {
      p_user_id: authUser.user.id,
      p_email: userValues.email,
      p_first_name: userValues.first_name,
      p_last_name: userValues.last_name,
      p_role_type_id: userValues.global_role,
    });

    if (rpcError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return { success: false, error: `Failed to set up user profile and role: ${rpcError.message}` };
    }

    // set userId
    newUserId = authUser.user.id;

    // send invite email
    if (userValues.send_invite) {
      // generate invite link
      const { data: inviteData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: userValues.email,
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

      const { data: userData, error: userDataError } = await supabaseAdmin.from("users").select("first_name, last_name").eq("id", currentUser.user.id).single();
      if (userDataError) {
        console.error("Error fetching user data:", userDataError);
        return { success: false, error: "Failed to fetch user data." };
      }


      // create email html
      const emailHtml = await render(
        InviteUserEmail({
          yourName: userData.first_name || "", // Replace with dynamic sender name if needed
          setupLink: inviteLink,
          clientName: userValues.first_name || userValues.email, // Or userValues.first_name
        })
      );

      // send email to user
      try {
        await sendEmail({
          to: userValues.email,
          subject: "Invite to Amrio Portal",
          text: "Invite to Amrio Portal",
          html: emailHtml,
        });
      } catch (error) {
        console.error("Error sending invite email:", error);
        return { success: false, error: "Failed to send invite email." };
      }
    }

    revalidatePath("/dashboard/admin/users", "layout");
    return { success: true, data: newUserId };
  } catch (overallError: any) {
    console.error("An unexpected error occurred in createUserInvite:", overallError);
    // Attempt to clean up auth user if created but something else failed
    if (newUserId) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch((cleanUpErr) => {
        console.error("Error during cleanup of auth user:", cleanUpErr);
      });
    }
    return { success: false, error: overallError.message || "An unknown error occurred." };
  }
}
