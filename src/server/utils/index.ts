import { cookies } from "next/headers";

// Helper function to get active tenant ID from cookies
export async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("active-tenant")?.value || null;
}
