import { AppSidebar } from "@/components/layout/app-sidebar";
import AutoBreadcrumbs from "@/components/layout/auto-bread-crumbs";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { ClientSessionWrapper } from "@/components/layout/ClientSessionWrapper"; // Adjust path as needed
import { UserSession } from "@/types/custom-supabase-types";
import { PostgrestError } from "@supabase/supabase-js";
import { redirect, unauthorized } from "next/navigation";
import { getActiveTenant } from "@/lib/utils/active-tenant-server";
import { getActiveWebsite } from "@/lib/utils/active-website-server";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const activeTenant = await getActiveTenant();
  const activeWebsite = await getActiveWebsite();


  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data, error } = (await supabase.rpc("get_user_session", {
    p_uid: user.id,
  })) as unknown as { data: UserSession; error: PostgrestError | null };

  if (error) {
    console.log(error);
    return unauthorized();
  }

  if (!data?.user_info?.is_onboarded) {
    return redirect("/onboarding");
  }

  return (
    <ClientSessionWrapper userData={data as UserSession} initialActiveTenant={activeTenant} initialActiveWebsite={activeWebsite} >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <AutoBreadcrumbs />
            </div>
          </header>
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ClientSessionWrapper>
  );
}
