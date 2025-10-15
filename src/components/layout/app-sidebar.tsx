"use client";
import { ArchiveRestore, AudioWaveform, BookOpen, Bot, Building2, Cctv, Command, GalleryVerticalEnd, Settings, SquareTerminal, User } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useUserSession } from "@/providers/session-provider";
import { NavAdmin } from "./nav/nav-admin";
import { NavMain } from "./nav/nav-main";
import { NavProjects } from "./nav/nav-projects";
import { NavUser } from "./nav/nav-user";
import { TeamSwitcher } from "./nav/team-switcher";

const data = {
  navMain: [
    {
      title: "Content",
      url: "/dashboard/pages",
      icon: Bot,
      items: [
        {
          title: "Your Websites",
          url: "/dashboard/websites",
        },
        {
          title: "Drafts",
          url: "/dashboard/pages/drafts",
        },
      ],
    },
    {
      title: "Storage",
      url: "/dashboard/storage",
      icon: ArchiveRestore,
    },
  ],

  projects: [
    // {
    //   name: "User Management",
    //   url: "/dashboard/users",
    //   icon: User,
    // },
    // {
    //   name: "Settings",
    //   url: "/dashboard/settings",
    //   icon: Settings
    // },
    // {
    //   name: "Roles",
    //   url: "/dashboard/projects/roles",
    //   icon: Cctv,
    // },
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
  ],
};

export function AppSidebar() {
  const { userSession } = useUserSession();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        {userSession?.global_roles && userSession.global_roles.some((role) => role === "system_admin") && <NavAdmin projects={data.admin} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userSession!.user_info} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
