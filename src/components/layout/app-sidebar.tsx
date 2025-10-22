"use client";
import {
  ArchiveRestore,
  AudioWaveform,
  BookOpen,
  Bot,
  Building2,
  Cctv,
  Command,
  FileText,
  FileUser,
  GalleryVerticalEnd,
  Globe,
  Library,
  Settings,
  SquareTerminal,
  StickyNote,
  User,
} from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useUserSession } from "@/providers/session-provider";
import { useActiveWebsite } from "@/hooks/use-active-website";
import { NavAdmin } from "./nav/nav-admin";
import { NavMain } from "./nav/nav-main";
import { NavProjects } from "./nav/nav-projects";
import { NavUser } from "./nav/nav-user";
import { WebsiteSwitcher } from "./nav/website-switcher";
import { TenantSwitcherModal } from "./nav/tenant-switcher-modal";

export function AppSidebar() {
  const { userSession } = useUserSession();
  const { activeWebsite } = useActiveWebsite();

  const data = {
    navMain: [
      // Website-specific items (only show if website is selected)
      ...(activeWebsite
        ? [
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
          ]
        : []),
      // Tenant-wide items
      {
        title: "Storage",
        url: "/dashboard/storage",
        icon: ArchiveRestore,
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
          <NavMain items={data.navMain} />
          {isAdmin && <NavAdmin projects={data.admin} />}
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
