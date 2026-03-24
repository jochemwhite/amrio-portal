"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useUserSession } from "@/providers/session-provider";
import { Check, ArrowLeft, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { UserSession } from "@/types/custom-supabase-types";
import { SupabaseWebsite } from "@/types/cms";
import { getWebsitesByTenant } from "@/actions/cms/website-actions";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

type Tenant = NonNullable<UserSession["tenants"]>[number];

type Step = "tenant" | "website";

export function TenantSwitcherModal() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("tenant");
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(null);
  const [websites, setWebsites] = React.useState<SupabaseWebsite[]>([]);
  const [loadingWebsites, setLoadingWebsites] = React.useState(false);
  const [direction, setDirection] = React.useState(1); // 1 for forward, -1 for backward

  const { userSession, setActiveTenant, setActiveWebsite } = useUserSession();

  // Keyboard shortcut: Cmd+O/Cmd+K (or Ctrl+O/Ctrl+K on Windows)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "o" || e.key === "k") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("tenant");
        setSelectedTenant(null);
        setWebsites([]);
      }, 200); // Wait for animation to complete
    }
  }, [open]);

  const availableTenants = userSession?.tenants ?? [];

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
          setDirection(1);
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
    setDirection(-1);
    setStep("tenant");
    setSelectedTenant(null);
    setWebsites([]);
  };

  if (!userSession) {
    return null;
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <VisuallyHidden>
        <DialogTitle>Switch Organization and Website</DialogTitle>
      </VisuallyHidden>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {step === "tenant" && (
            <motion.div
              key="tenant"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <CommandInput placeholder="Search organizations..." />
              <CommandList>
                <CommandEmpty>No organizations found.</CommandEmpty>
                <CommandGroup heading="Organizations">
                  {availableTenants.map((tenant: Tenant) => (
                    <CommandItem
                      key={tenant.id}
                      value={tenant.name}
                      onSelect={() => handleTenantSelect(tenant)}
                      className="flex items-center gap-3 p-3"
                      disabled={loadingWebsites}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={tenant.logo_url ?? undefined} />
                        <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{tenant.name}</span>
                      </div>
                      {loadingWebsites && selectedTenant?.id === tenant.id ? (
                        <Spinner size={16} />
                      ) : (
                        userSession?.active_tenant?.id === tenant.id && <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t p-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Press{" "}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>Ctrl K
                  </kbd>{" "}
                  to toggle
                </p>
              </div>
            </motion.div>
          )}

          {step === "website" && (
            <motion.div
              key="website"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Select Website for {selectedTenant?.name}</span>
              </div>
              <CommandList>
                <CommandEmpty>No websites found for this organization.</CommandEmpty>
                <CommandGroup heading="Websites">
                  {websites.map((website) => (
                    <CommandItem
                      key={website.id}
                      value={website.name}
                      onSelect={() => handleWebsiteSelect(website)}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{website.name}</span>
                        <span className="text-xs text-muted-foreground">{website.domain}</span>
                      </div>
                      {userSession?.active_website?.id === website.id && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CommandDialog>
  );
}
