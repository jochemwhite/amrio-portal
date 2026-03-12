"use client";

import * as React from "react";
import { ChevronsUpDown, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUserSession } from "@/providers/session-provider";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";
import { Website } from "@/types/cms";



export function WebsiteSwitcher() {
  const { isMobile } = useSidebar();
  const { userSession, setActiveWebsite } = useUserSession();

  const [open, setOpen] = React.useState(false);
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [loading, setLoading] = React.useState(false);

  const activeWebsite = userSession?.active_website;
  const activeTenantId = userSession?.active_tenant?.id;

  // Fetch websites when dropdown opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen && activeTenantId && websites.length === 0) {
      setLoading(true);
      try {
        const result = await getWebsitesByTenant(activeTenantId);
        if (result.success && result.data) {
          setWebsites(result.data as Website[]);
        }
      } catch (e) {
        console.error("Failed to load websites:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  // Clear cached websites when tenant changes so next open re-fetches
  React.useEffect(() => {
    setWebsites([]);
  }, [activeTenantId]);

  if (!activeWebsite) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled size="lg" className="cursor-default">
            <Globe className="h-5 w-5" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">No Websites</span>
              <span className="truncate text-xs text-muted-foreground">
                Create a website to get started
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Globe className="h-5 w-5 shrink-0" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeWebsite.name}</span>
                <span className="truncate text-xs text-muted-foreground">{activeWebsite.url}</span>
              </div>
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Websites
            </DropdownMenuLabel>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : websites.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                No websites found
              </div>
            ) : (
              websites.map((website, index) => (
                <DropdownMenuItem
                  key={website.id}
                  onClick={() => setActiveWebsite(website)}
                  className={cn(
                    "gap-2 p-3",
                    website.id === activeWebsite.id && "bg-sidebar-accent"
                  )}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="font-medium">{website.name}</div>
                    <div className="text-xs text-muted-foreground">{website.domain}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={website.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {website.status}
                    </Badge>
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}