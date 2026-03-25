import type { Metadata } from "next";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PostgrestError } from "@supabase/supabase-js";
import { AlertCircle, FolderOpen } from "lucide-react";
import Link from "next/link";

import { StoragePageClient } from "@/components/storage/StoragePageClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { UserSession } from "@/types/custom-supabase-types";

const ACTIVE_TENANT_COOKIE = "active-tenant";
const ACTIVE_WEBSITE_COOKIE = "active-website";

export const metadata: Metadata = {
  title: "Storage",
  description: "Manage uploaded files and folders for your tenant.",
};

function StoragePageShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function StoragePageFallback({
  title,
  description,
  actionHref,
  actionLabel,
  destructive = false,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  destructive?: boolean;
}) {
  return (
    <StoragePageShell>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Storage</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage folders and media for the active tenant.
        </p>
      </div>

      <Alert variant={destructive ? "destructive" : "default"}>
        <AlertCircle className="size-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>

      {actionHref && actionLabel ? (
        <div>
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </StoragePageShell>
  );
}

export default async function StoragePage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const { data: sessionData, error: sessionError } = (await supabase.rpc(
    "get_user_session",
    {
      p_uid: user.id,
      p_active_tenant_id: activeTenantId,
    },
  )) as unknown as { data: UserSession; error: PostgrestError | null };

  if (sessionError || !sessionData.active_tenant?.id) {
    if (sessionError) {
      console.error("Failed to load storage session.", sessionError);
    }

    return (
      <StoragePageFallback
        title="Tenant session unavailable"
        description="We couldn't resolve your active tenant for storage. Try switching tenants or refreshing the page."
        actionHref="/dashboard"
        actionLabel="Back to dashboard"
        destructive={Boolean(sessionError)}
      />
    );
  }

  let activeWebsiteId = cookieStore.get(ACTIVE_WEBSITE_COOKIE)?.value ?? null;

  if (activeWebsiteId) {
    const { data: website } = await supabase
      .from("cms_websites")
      .select("id")
      .eq("id", activeWebsiteId)
      .eq("tenant_id", sessionData.active_tenant.id)
      .maybeSingle();

    if (!website) {
      activeWebsiteId = null;
    }
  }

  if (!activeWebsiteId) {
    const { data: website } = await supabase
      .from("cms_websites")
      .select("id")
      .eq("tenant_id", sessionData.active_tenant.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    activeWebsiteId = website?.id ?? null;
  }

  if (!activeWebsiteId) {
    return (
      <StoragePageFallback
        title="No website selected"
        description="Storage is scoped to a website. Select a website first, then come back here to manage files and folders."
        actionHref="/dashboard"
        actionLabel="Back to dashboard"
      />
    );
  }

  try {
    const [
      { data: tenant, error: tenantError },
      { data: rootFolders, error: folderError },
      { data: rootFiles, error: fileError },
    ] = await Promise.all([
      supabase
        .from("tenants")
        .select("id, name, storage_used_bytes, storage_quota_bytes")
        .eq("id", sessionData.active_tenant.id)
        .single(),
      supabase
        .from("folders")
        .select("*")
        .eq("tenant_id", sessionData.active_tenant.id)
        .eq("website_id", activeWebsiteId)
        .is("parent_folder_id", null)
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("files")
        .select("*")
        .eq("tenant_id", sessionData.active_tenant.id)
        .eq("website_id", activeWebsiteId)
        .is("folder_id", null)
        .is("deleted_at", null)
        .eq("upload_status", "confirmed")
        .order("created_at", { ascending: false }),
    ]);

    if (tenantError || folderError || fileError || !tenant) {
      console.error("Failed to load storage page data.", {
        tenantError,
        folderError,
        fileError,
        tenantId: sessionData.active_tenant.id,
        websiteId: activeWebsiteId,
      });

      return (
        <StoragePageFallback
          title="Storage data couldn't be loaded"
          description="Some storage information failed to load. Please refresh the page or try again in a moment."
          actionHref="/dashboard/storage"
          actionLabel="Retry storage"
          destructive
        />
      );
    }

    return (
      <StoragePageClient
        tenantId={tenant.id}
        tenantName={tenant.name}
        websiteId={activeWebsiteId}
        quota={{
          usedBytes: tenant.storage_used_bytes ?? 0,
          quotaBytes: tenant.storage_quota_bytes,
        }}
        initialRootFolders={rootFolders ?? []}
        initialRootFiles={rootFiles ?? []}
      />
    );
  } catch (error) {
    console.error("Unexpected error rendering storage page.", error);

    return (
      <StoragePageFallback
        title="Something went wrong"
        description="An unexpected error prevented the storage page from loading. Please refresh and try again."
        actionHref="/dashboard/storage"
        actionLabel="Retry storage"
        destructive
      />
    );
  }
}
