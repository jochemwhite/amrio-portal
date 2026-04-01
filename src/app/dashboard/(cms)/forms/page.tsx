import {
  getFormsForActiveWebsite,
  getFormStatsForActiveWebsite,
} from "@/actions/cms/form-actions";
import { FormsOverview } from "@/components/cms/forms/forms-overview";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantAndWebsiteIds } from "@/server/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Forms",
  description: "Manage form builder definitions for your selected website.",
};

export default async function FormsPage() {
  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">No active tenant selected.</p>
      </div>
    );
  }

  if (!websiteId) {
    redirect("/dashboard/websites");
  }

  const { data: website, error: websiteError } = await supabase
    .from("cms_websites")
    .select("id")
    .eq("id", websiteId)
    .eq("tenant_id", tenantId)
    .single();

  if (websiteError || !website) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">
          Website not found for the selected tenant.
        </p>
      </div>
    );
  }

  const [formsResult, statsResult] = await Promise.all([
    getFormsForActiveWebsite(),
    getFormStatsForActiveWebsite(),
  ]);

  const forms = formsResult.success ? (formsResult.data ?? []) : [];
  const stats: NonNullable<typeof statsResult.data> =
    statsResult.success && statsResult.data
      ? statsResult.data
      : {
          visits: 0,
          submissions: 0,
          submissionRate: 0,
          bounceRate: 0,
        };

  return <FormsOverview initialForms={forms} initialStats={stats} />;
}
