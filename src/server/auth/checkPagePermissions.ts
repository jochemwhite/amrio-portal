import { createClient } from "@/lib/supabase/supabaseServerClient";
import { Database } from "@/types/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface CheckPermissionsOptions {
  requiredRole: Database["public"]["Enums"]["global_roles"] /* Add other roles as needed from your app_role enum */;
  redirectToSignIn?: boolean; // Optionally redirect to sign-in if not authenticated
  unauthorizedRedirectPath?: string; // Optionally redirect to a specific unauthorized page
}

export async function checkPagePermissions(options: CheckPermissionsOptions): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (options.redirectToSignIn) {
      redirect("/auth/signin"); // Or your sign-in page route
    }
    return false;
  }

  const jwt = session.access_token;

  try {
    const payloadBase64 = jwt.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    const portalRoles: string[] = payload?.portal_roles || []; // Default to empty array if no portal_roles claim


    if (options.requiredRole === "system_admin") {
      return portalRoles.includes("system_admin");
    }


    return false; // Role not recognized or not matching
  } catch (error) {
    console.error("Error decoding JWT or checking permissions:", error);
    return false; // Handle JWT errors as permission denied
  }
}
