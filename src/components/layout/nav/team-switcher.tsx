"use client";

import * as React from "react";
import { ChevronsUpDown, ArrowLeft, Globe } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { useUserSession } from "@/providers/session-provider";
import { UserSession } from "@/types/custom-supabase-types";
import { SupabaseWebsite } from "@/types/cms";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

type Tenant = UserSession["tenants"][0];
type Step = "tenant" | "website";

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { activeTenant, setActiveTenant: setActiveTenantHook, availableTenants, hasMultipleTenants, isInitialized } = useActiveTenant();
  const { userSession, setActiveTenant, setActiveWebsite } = useUserSession();
  
  const [step, setStep] = React.useState<Step>("tenant");
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(null);
  const [websites, setWebsites] = React.useState<SupabaseWebsite[]>([]);
  const [loadingWebsites, setLoadingWebsites] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Reset state when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("tenant");
        setSelectedTenant(null);
        setWebsites([]);
      }, 200);
    }
  }, [open]);

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  const handleTenantSelect = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setLoadingWebsites(true);

    try {
      const result = await getWebsitesByTenant(tenant.id);
      if (result.success && result.data) {
        const websiteList = result.data as SupabaseWebsite[];
        setWebsites(websiteList);

        // If no websites or only 1 website, auto-select and close
        if (websiteList.length === 0) {
          setActiveTenant(tenant);
          setOpen(false);
        } else if (websiteList.length === 1) {
          setActiveTenant(tenant);
          setActiveWebsite(websiteList[0]);
          setOpen(false);
        } else {
          // Multiple websites - show selection step
          setStep("website");
        }
      }
    } catch (error) {
      console.error("Error fetching websites:", error);
      // On error, just set tenant and close
      setActiveTenant(tenant);
      setOpen(false);
    } finally {
      setLoadingWebsites(false);
    }
  };

  const handleWebsiteSelect = (website: SupabaseWebsite) => {
    if (selectedTenant) {
      setActiveTenant(selectedTenant);
      setActiveWebsite(website);
      setOpen(false);
    }
  };

  const handleBack = () => {
    setStep("tenant");
    setSelectedTenant(null);
    setWebsites([]);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              disabled={!hasMultipleTenants}
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ",
                !hasMultipleTenants && "cursor-default hover:bg-transparent disabled:cursor-default disabled:hover:bg-transparent disabled:opacity-100"
              )}
            >
              <div className="flex items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <Avatar>
                  <AvatarImage src={activeTenant?.logo_url} />
                  <AvatarFallback>{activeTenant?.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeTenant?.name}</span>
              </div>
              {hasMultipleTenants && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {step === "tenant" && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
                {availableTenants.map((team, index) => (
                  <DropdownMenuItem 
                    key={team.id} 
                    onClick={() => handleTenantSelect(team)} 
                    className="gap-2 p-3"
                    disabled={loadingWebsites}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Avatar className="mr-2">
                        <AvatarImage src={team.logo_url} />
                        <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    {team.name}
                    {loadingWebsites && selectedTenant?.id === team.id ? (
                      <div className="ml-auto">
                        <Spinner size={16} />
                      </div>
                    ) : (
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {step === "website" && (
              <>
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBack} 
                    className="h-6 w-6 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
                    Select Website
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {websites.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No websites found
                    </div>
                  ) : (
                    websites.map((website) => (
                      <DropdownMenuItem
                        key={website.id}
                        onClick={() => handleWebsiteSelect(website)}
                        className="gap-2 p-3"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary/10">
                          <Globe className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{website.name}</span>
                          <span className="text-xs text-muted-foreground">{website.domain}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
