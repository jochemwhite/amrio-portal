"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";

export async function createCMSBucketFolder(tenantId: string) {
  const bucket = "cms_storage";
  const key = `${tenantId}/.keep`;
  const content = new Blob([], { type: 'text/plain' });

  // Create an empty .keep file to maintain the folder structure
  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(key, content, { upsert: false });
  if (error) {
    throw error;
  }

  return data;
}
