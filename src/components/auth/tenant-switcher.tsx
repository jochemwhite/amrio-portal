"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useUserSession } from "@/providers/session-provider";
import { searchTenants, TenantSearchResult } from "@/actions/tenant-actions";

export function TenantSwitcher() {
  const { userSession, setActiveTenant } = useUserSession();
  const isSystemAdmin = userSession?.global_roles?.includes("system_admin");

  const [open, setOpen]              = useState(false);
  const [query, setQuery]            = useState("");
  const [tenants, setTenants]        = useState<TenantSearchResult[]>([]);
  const [hasMore, setHasMore]        = useState(false);
  const [page, setPage]              = useState(1);
  const [isPending, startTransition] = useTransition();

  // Ctrl+K / Cmd+K
  useEffect(() => {
    if (!isSystemAdmin) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSystemAdmin]);

  // Initial load when modal opens
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPage(1);
    fetchTenants("", 1, false);
  }, [open]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      fetchTenants(query, 1, false);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const fetchTenants = (q: string, p: number, append: boolean) => {
    startTransition(async () => {
      const result = await searchTenants(q, p);
      setTenants((prev) => append ? [...prev, ...result.tenants] : result.tenants);
      setHasMore(result.hasMore);
    });
  };

  const handleSelect = async (tenant: TenantSearchResult) => {
    setOpen(false);
    // setActiveTenant sets cookie + revalidates server — no router.refresh() needed
    await setActiveTenant({
      id:       tenant.id,
      name:     tenant.name,
      logo_url: tenant.logo_url,
      website:  tenant.website,
    });
    window.location.reload()
  };

  if (!isSystemAdmin) return null;

  const activeTenantId = userSession?.active_tenant?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Switch Tenant</DialogTitle>
        <DialogDescription>Search and switch to a different tenant</DialogDescription>
      </DialogHeader>
      <DialogContent className="top-1/3 translate-y-0 overflow-hidden rounded-xl p-0">
        <Command shouldFilter={false} className="rounded-xl">
          <CommandInput
            placeholder="Search tenants..."
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            {isPending ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {query ? `No tenants found for "${query}"` : "No tenants available"}
                </CommandEmpty>

                <CommandGroup heading="Tenants">
                  {tenants.map((tenant) => (
                    <CommandItem
                      key={tenant.id}
                      value={tenant.name}
                      onSelect={() => handleSelect(tenant)}
                      data-checked={tenant.id === activeTenantId}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted text-[10px] font-semibold uppercase overflow-hidden">
                        {tenant.logo_url
                          ? <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
                          : tenant.name.slice(0, 2)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="truncate">{tenant.name}</span>
                        {tenant.website && (
                          <span className="ml-2 text-xs text-muted-foreground truncate">
                            {tenant.website}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {hasMore && (
                  <CommandGroup>
                    <CommandItem
                      value="__load_more__"
                      onSelect={() => {
                        const next = page + 1;
                        setPage(next);
                        fetchTenants(query, next, true);
                      }}
                      className="justify-center text-muted-foreground"
                    >
                      Load more
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>

          <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
            <span className="ml-auto"><kbd className="font-mono">⌘K</kbd> toggle</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}