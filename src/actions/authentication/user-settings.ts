"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { UserFormValues } from "@/schemas/user-form";
import { uploadProfileImage } from "@/server/utils/upload-profile-image";
import { ActionResponse } from "@/types/actions";
import { Session } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateUser(formData: Partial<UserFormValues>): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const { data, error } = await supabase.from("users").update(formData).eq("id", currentUser.user.id);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "update_user",
    user_id: currentUser.user.id,
    target_user_id: currentUser.user.id,
    metadata: { formData },
    ip_address: null,
    user_agent: null,
  });

  revalidatePath("/dashboard/", "layout");

  return { success: true };
}

// update user profile image
export async function updateUserProfileImage(file: any): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const isFileLike = (obj: any) =>
    obj && typeof obj === "object" && typeof obj.name === "string" && typeof obj.type === "string" && typeof obj.size === "number";

  let url: string | undefined;

  if (isFileLike(file)) {
    const result = await uploadProfileImage(currentUser.user.id, file);
    if (result.error) {
      return { success: false, error: result.error };
    }
    url = result.url;
  }

  return { success: true, data: url };
}


// update user password
export async function updateUserPassword( currentPassword: string, newPassword: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: currentUser.user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: signInError.message };
  }

  // update password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  
  
  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}



export async function enroll2FA(): Promise<ActionResponse<{ factorId: string; qr: string; secret: string }>> {
  const supabase = await createClient();
  // Generate a UUID for the friendly name (server-side)
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  const friendlyName = `Authenticator ${uuidv4()}`;
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });
  if (error) {
    console.log("error enroll2FA", error);
    return { success: false, error: error.message };
  }
  return {
    success: true,
    data: {
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    },
  };
}

export async function challenge2FA(factorId: string): Promise<ActionResponse<{ challengeId: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: { challengeId: data.id } };
}

export async function verify2FA({ factorId, challengeId, code }: { factorId: string; challengeId: string; code: string }): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  if (error) {
    console.log("error verify2FA", error);
    return { success: false, error: error.message };
  }

  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "verify_2fa",
    user_id: currentUser.user.id,
    target_user_id: currentUser.user.id,
    metadata: { factorId, challengeId, code },
    ip_address: null,
    user_agent: null,
  });
  await supabase.auth.refreshSession();
  return { success: true };
}


export async function remove2FA(): Promise<ActionResponse<Session>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factors.totp[0].id });
  }
  const { data: { session } } = await supabase.auth.refreshSession();
  if (!session) {
    return { success: false, error: "Failed to refresh session" };
  }
  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "remove_2fa",
    user_id: currentUser.user.id,
    target_user_id: currentUser.user.id,
    ip_address: null, 
    user_agent: null,
  });
  return { success: true, data: session };
}