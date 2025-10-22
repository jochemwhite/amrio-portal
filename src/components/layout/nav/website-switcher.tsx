"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useActiveWebsite } from "@/hooks/use-active-website";

export function WebsiteSwitcher() {
  const { isMobile } = useSidebar();
  const { activeWebsite, setActiveWebsite, availableWebsites, hasMultipleWebsites, isInitialized } = useActiveWebsite();

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  // Show a placeholder when no websites are available
  if (availableWebsites.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled size="lg" className="cursor-default">
            <div className="flex items-center justify-center rounded-lg text-sidebar-primary-foreground">
              <Globe className="h-5 w-5" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">No Websites</span>
              <span className="truncate text-xs text-muted-foreground">Create a website to get started</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              disabled={!hasMultipleWebsites}
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ",
                !hasMultipleWebsites &&
                  "cursor-default hover:bg-transparent disabled:cursor-default disabled:hover:bg-transparent disabled:opacity-100"
              )}
            >
              <div className="flex items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <Globe className="h-5 w-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeWebsite?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{activeWebsite?.domain}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={activeWebsite?.status === "active" ? "default" : "secondary"} className="text-xs">
                  {activeWebsite?.status}
                </Badge>
                {hasMultipleWebsites && <ChevronsUpDown className="ml-1 h-4 w-4" />}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Websites</DropdownMenuLabel>
            {availableWebsites.map((website, index) => (
              <DropdownMenuItem key={website.id} onClick={() => setActiveWebsite(website)} className="gap-2 p-3">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="font-medium">{website.name}</div>
                  <div className="text-xs text-muted-foreground">{website.domain}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={website.status === "active" ? "default" : "secondary"} className="text-xs">
                    {website.status}
                  </Badge>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
