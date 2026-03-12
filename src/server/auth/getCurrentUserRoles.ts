"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { Database } from "@/types/supabase";

// New function to get user roles as a string array
export async function getCurrentUserRoles(): Promise<Database["public"]["Enums"]["global_roles"][]> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return []; // No session, no roles
  }

  const jwt = session.access_token;

  try {
    const payloadBase64 = jwt.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));

    return (payload?.user_role || []) as Database["public"]["Enums"]["global_roles"][] // Return portal_roles as string array, default to empty array
  } catch (error) {
    console.error("Error decoding JWT to get user roles:", error);
    return []; // Return empty array on error
  }
}
