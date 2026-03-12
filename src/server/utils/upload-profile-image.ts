'use server'

import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";

export async function uploadProfileImage(user_id: string, file: File): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeMB = 2;

  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG, PNG, or WEBP images are allowed." };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { error: `File size must be less than ${maxSizeMB}MB.` };
  }

  const type = file.type.split("/")[1];
  const filePath = `/profile_images/${user_id}-profile_image.${type}`;
  const { data, error } = await supabase.storage.from("users").upload(filePath, file, {
    upsert: true,
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "upload_profile_image",
    user_id,
    metadata: { filePath },
    ip_address: null,
    user_agent: null,
  });

  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/users/${data.path}`;

  // update user profile image
  await supabase.from("users").update({ avatar: url }).eq("id", user_id);

  return { url };
}