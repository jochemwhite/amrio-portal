"use client";
import {
  ArchiveRestore,
  Building2,
  FileText,
  FileUser,
  Key,
  LayoutTemplate,
  Library,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useUserSession } from "@/providers/session-provider";
import { NavAdmin } from "./nav/nav-admin";
import { NavCms } from "./nav/nav-main";
import { NavTenant } from "./nav/nav-tenant";
import { NavUser } from "./nav/nav-user";
import { WebsiteSwitcher } from "./nav/website-switcher";

export function AppSidebar() {
  const { userSession } = useUserSession();

  // Session is being cleared (logout in flight) — render nothing
  if (!userSession) return null;

  const isAdmin = userSession.global_roles?.some(
    (role) => role === "system_admin",
  );

  const data = {
    cms: [
      { title: "Pages", url: "/dashboard/pages", icon: FileText },
      { title: "Collections", url: "/dashboard/collections", icon: Library },
      { title: "Forms", url: "/dashboard/forms", icon: FileUser },
      { title: "Layouts", url: "/dashboard/layouts", icon: LayoutTemplate },
    ],
    tenant: [
      { title: "Storage", url: "/dashboard/storage", icon: ArchiveRestore },
      { title: "API Keys", url: "/dashboard/api-keys", icon: Key },
    ],
    admin: [
      { name: "Users", url: "/dashboard/admin/users", icon: User },
      { name: "Tenants", url: "/dashboard/admin/tenants", icon: Building2 },
      { name: "Schemas", url: "/dashboard/admin/schemas", icon: FileText },
    ],
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <WebsiteSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavCms cmsItems={data.cms} />
          <NavTenant tenantItems={data.tenant} />
          {isAdmin && <NavAdmin adminItems={data.admin} />}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userSession.user_info} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
