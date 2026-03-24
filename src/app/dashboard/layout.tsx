import { TenantSwitcher } from "@/components/auth/tenant-switcher";
import { AppSidebar } from "@/components/layout/app-sidebar";
import AutoBreadcrumbs from "@/components/layout/auto-bread-crumbs";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { SessionProvider } from "@/providers/session-provider";
import { UserSession } from "@/types/custom-supabase-types";
import { PostgrestError } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACTIVE_TENANT_COOKIE  = "active-tenant";
const ACTIVE_WEBSITE_COOKIE = "active-website";

export const metadata: Metadata = {
  description: "Manage your CMS content, pages, layouts, and collections.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // 1. Verify session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // 2. Check MFA
  const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfa && mfa.nextLevel === "aal2" && mfa.nextLevel !== mfa.currentLevel) {
    redirect("/mfa");
  }

  // 3. Resolve active tenant from cookie
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;

  // 4. Single RPC — returns user_info, global_roles, active_tenant
  const { data, error } = await supabase.rpc("get_user_session", {
    p_uid: user.id,
    p_active_tenant_id: activeTenantId,
  }) as unknown as { data: UserSession; error: PostgrestError | null };

  if (error || !data) redirect("/");
  if (!data.user_info?.is_onboarded) redirect("/onboarding");

  // 5. Resolve active website for the active tenant
  let activeWebsite: UserSession["active_website"] = null;

  if (data.active_tenant?.id) {
    const savedWebsiteId = cookieStore.get(ACTIVE_WEBSITE_COOKIE)?.value;

    if (savedWebsiteId) {
      const { data: website } = await supabase
        .from("cms_websites")
        .select("id, name, domain")
        .eq("id", savedWebsiteId)
        .eq("tenant_id", data.active_tenant.id)
        .single();

      if (website) {
        activeWebsite = { id: website.id, name: website.name, url: website.domain ?? "" };
      }
    }

    if (!activeWebsite) {
      const { data: website } = await supabase
        .from("cms_websites")
        .select("id, name, domain")
        .eq("tenant_id", data.active_tenant.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (website) {
        activeWebsite = { id: website.id, name: website.name, url: website.domain ?? "" };
      }
    }
  }

  // 6. Pass fully resolved session to client
  // SessionProvider will persist tenant/website cookies on mount
  const initialSession: UserSession = {
    ...data,
    active_website: activeWebsite,
  };

  return (
    <SessionProvider initialSession={initialSession}>
      <TooltipProvider>
        <TenantSwitcher />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <AutoBreadcrumbs />
              </div>
            </header>
            <main className="flex-1 p-4">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
