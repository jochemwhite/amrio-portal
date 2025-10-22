"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Check } from "lucide-react";
import * as React from "react";

export function TenantSwitcherModal() {
  const [open, setOpen] = React.useState(false);
  const { activeTenant, setActiveTenant, availableTenants, isInitialized } = useActiveTenant();

  // Keyboard shortcut: Cmd+Shift+O (or Ctrl+Shift+O on Windows)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "o" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
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
              {activeTenant?.id === tenant.id && <Check className="h-4 w-4 text-primary" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="border-t p-2 text-center">
        <p className="text-xs text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>Shift O
          </kbd>{" "}
          to toggle
        </p>
      </div>
    </CommandDialog>
  );
}
