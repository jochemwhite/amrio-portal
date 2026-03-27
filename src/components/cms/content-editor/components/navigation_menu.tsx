"use client";

import { getPagesByWebsiteId } from "@/actions/cms/page-actions";
import { NavBuilderTrigger } from "./nav-builder";
import type { NavItem, NavMenu } from "./nav-builder";
import { Label } from "@/components/ui/label";
import { useUserSession } from "@/providers/session-provider";
import { FieldComponentProps, useContentEditorStore } from "@/stores/content-editor-store";
import type { MenuItem } from "@/types/cms";
import { useEffect, useState } from "react";

type PageOption = {
  id: string;
  title: string;
  slug: string;
};

export default function NavigationMenuComponent({
  field,
  handleFieldChange,
  value,
}: FieldComponentProps) {
  const websiteId = useContentEditorStore((state) => state.websiteId);
  const { userSession } = useUserSession();
  const [availablePages, setAvailablePages] = useState<PageOption[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);

  const tenantId =
    userSession?.active_tenant?.id ??
    websiteId ??
    `tenant-${field.id}`;
  const maxDepth =
    typeof field.settings?.maxDepth === "number" && field.settings.maxDepth >= 1
      ? field.settings.maxDepth
      : 2
  const initialMenu = normalizeNavigationValue({
    fieldName: field.name,
    tenantId,
    value,
  });

  useEffect(() => {
    if (!websiteId) {
      return;
    }

    let isMounted = true;

    const loadPages = async () => {
      setIsLoadingPages(true);
      setPagesError(null);

      const result = await getPagesByWebsiteId(websiteId);
      if (!isMounted) {
        return;
      }

      if (!result.success || !result.data) {
        setAvailablePages([]);
        if (result.error && result.error !== "No pages found. ") {
          setPagesError(result.error);
        }
        setIsLoadingPages(false);
        return;
      }

      setAvailablePages(
        result.data.map((page) => ({
          id: page.id,
          title: page.name,
          slug: page.slug,
        }))
      );
      setIsLoadingPages(false);
    };

    void loadPages();

    return () => {
      isMounted = false;
    };
  }, [websiteId]);

  const handleSaveMenu = async (menu: NavMenu) => {
    handleFieldChange(field.id, menu);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>
          {field.name}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <p className="text-sm text-muted-foreground">
          Open the full-screen navigation editor to organize pages, custom links, and nesting.
        </p>
        {field.description ? (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        ) : null}
        {pagesError ? (
          <p className="text-sm text-destructive">{pagesError}</p>
        ) : null}
      </div>

      <div className="rounded-xl border bg-background p-4">
        <NavBuilderTrigger
          tenantId={tenantId}
          initialMenu={initialMenu}
          availablePages={websiteId ? availablePages : []}
          onSave={handleSaveMenu}
          isLoading={isLoadingPages}
          maxDepth={maxDepth}
        />
      </div>
    </div>
  );
}

function normalizeNavigationValue({
  fieldName,
  tenantId,
  value,
}: {
  fieldName: string;
  tenantId: string;
  value: unknown;
}): NavMenu | undefined {
  if (!value) {
    return undefined;
  }

  if (isNavMenu(value)) {
    return {
      ...value,
      name: value.name || fieldName,
      tenantId: value.tenantId || tenantId,
      items: sanitizeNavItems(value.items),
    };
  }

  if (Array.isArray(value)) {
    return {
      id: crypto.randomUUID(),
      name: fieldName,
      tenantId,
      items: sanitizeNavItems(value.map(convertLegacyMenuItem)),
      updatedAt: new Date().toISOString(),
    };
  }

  return undefined;
}

function isNavMenu(value: unknown): value is NavMenu {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NavMenu>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    Array.isArray(candidate.items)
  );
}

function convertLegacyMenuItem(item: unknown): NavItem {
  const legacyItem = item as Partial<MenuItem>;

  return {
    id: legacyItem.id ?? crypto.randomUUID(),
    label: legacyItem.label ?? "Untitled item",
    href: legacyItem.url ?? "/",
    target: legacyItem.target ?? "_self",
    icon: legacyItem.icon,
    children: legacyItem.children?.map(convertLegacyMenuItem),
  };
}

function sanitizeNavItems(items: NavItem[]): NavItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    target: item.target,
    icon: item.icon,
    children: item.children?.map((child) => ({
      id: child.id,
      label: child.label,
      href: child.href,
      target: child.target,
      icon: child.icon,
    })),
  }));
}
