import { cookies } from "next/headers";

const ACTIVE_TENANT_COOKIE = "active-tenant";
const ACTIVE_WEBSITE_COOKIE = "active-website";

export async function getActiveTenantAndWebsiteIds(): Promise<{ tenantId: string | null; websiteId: string | null }> {
  const cookieStore = await cookies();

  return {
    tenantId: cookieStore.get(ACTIVE_TENANT_COOKIE)?.value || null,
    websiteId: cookieStore.get(ACTIVE_WEBSITE_COOKIE)?.value || null,
  };
}

// Helper function to get active tenant ID from cookies
export async function getActiveTenantId(): Promise<string | null> {
  const { tenantId } = await getActiveTenantAndWebsiteIds();
  return tenantId;
}

// Helper function to get active website ID from cookies
export async function getActiveWebsiteId(): Promise<string | null> {
  const { websiteId } = await getActiveTenantAndWebsiteIds();
  return websiteId;
}
