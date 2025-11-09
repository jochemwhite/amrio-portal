"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useUserSession } from "@/providers/session-provider";
import { Check } from "lucide-react";
import * as React from "react";

export function TenantSwitcherModal() {
  const [open, setOpen] = React.useState(false);
  const { userSession, setActiveTenant } = useUserSession();
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


  const availableTenants = userSession?.tenants || [];


  if (!userSession) {
    return null;
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <VisuallyHidden>
        <DialogTitle>Switch Organization</DialogTitle>
      </VisuallyHidden>
      <CommandInput placeholder="Search organizations..." />
      <CommandList>
        <CommandEmpty>No organizations found.</CommandEmpty>
        <CommandGroup heading="Organizations">
          {availableTenants.map((tenant) => (
            <CommandItem
              key={tenant.id}
              value={tenant.name}
              onSelect={() => {
                setActiveTenant(tenant);
                setOpen(false);
              }}
              className="flex items-center gap-3 p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={tenant.logo_url} />
                <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{tenant.name}</span>
              </div>
              {userSession?.active_tenant?.id === tenant.id && <Check className="h-4 w-4 text-primary" />}
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
    </CommandDialog>
  );
}
