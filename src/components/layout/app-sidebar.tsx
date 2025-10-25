"use client";
import { ArchiveRestore, Building2, FileText, FileUser, GalleryVerticalEnd, Key, Library, User } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useActiveWebsite } from "@/hooks/use-active-website";
import { useUserSession } from "@/providers/session-provider";
import { NavAdmin } from "./nav/nav-admin";
import { NavCms } from "./nav/nav-main";
import { NavUser } from "./nav/nav-user";
import { TenantSwitcherModal } from "./nav/tenant-switcher-modal";
import { WebsiteSwitcher } from "./nav/website-switcher";
import { NavTenant } from "./nav/nav-tenant";

export function AppSidebar() {
  const { userSession } = useUserSession();
  const { activeWebsite } = useActiveWebsite();

  const data = {
    cms: [
      {
        title: "Pages",
        url: "/dashboard/pages",
        icon: FileText,
      },
      {
        title: "Collections",
        url: "/dashboard/collections",
        icon: Library,
      },
      {
        title: "Forms",
        url: "/dashboard/forms",
        icon: FileUser,
      },
    ],

    tenant: [
      {
        title: "Storage",
        url: "/dashboard/storage",
        icon: ArchiveRestore,
      },
      {
        title: "API Keys",
        url: "/dashboard/api-keys",
        icon: Key,
      },
    ],

    admin: [
      {
        name: "Users",
        url: "/dashboard/admin/users",
        icon: User,
      },
      {
        name: "Tenants",
        url: "/dashboard/admin/tenants",
        icon: Building2,
      },
      {
        name: "Websites",
        url: "/dashboard/admin/websites",
        icon: GalleryVerticalEnd,
      },
      {
        name: "Schemas",
        url: "/dashboard/admin/schemas",
        icon: FileText,
      },
    ],
  };

  const isAdmin = userSession?.global_roles?.some((role) => role === "system_admin");

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
          <NavUser user={userSession!.user_info} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Tenant Switcher Modal - Only for admins */}
      {isAdmin && <TenantSwitcherModal />}
    </>
  );
}
