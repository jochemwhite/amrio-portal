import { getLayoutTemplateById, getLayoutAssignmentsByWebsite } from "@/actions/cms/layout-actions";
import { getPagesByWebsiteId } from "@/actions/cms/page-actions";
import { AssignmentManager } from "@/components/cms/layouts/AssignmentManager";
import { getActiveTenantId } from "@/server/utils";
import { notFound, redirect } from "next/navigation";

interface AssignmentsPageProps {
  params: Promise<{ websiteId: string; templateId: string }>;
}

export default async function AssignmentsPage({ params }: AssignmentsPageProps) {
  const { websiteId, templateId } = await params;
  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    redirect("/dashboard");
  }

  // Get the layout template
  const templateResult = await getLayoutTemplateById(templateId);

  if (!templateResult.success || !templateResult.data) {
    console.error("Template not found:", templateResult.error);
    notFound();
  }

  const template = templateResult.data;

  // Get all assignments for this website
  const assignmentsResult = await getLayoutAssignmentsByWebsite(websiteId);
  const allAssignments = assignmentsResult.success ? assignmentsResult.data : [];

  // Filter to only this template's assignments
  const templateAssignments = allAssignments.filter((a) => a.template_id === templateId);

  // Get all pages for this website (for specific page assignments)
  const pagesResult = await getPagesByWebsiteId(websiteId);
  const pages = pagesResult.success ? pagesResult.data : [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">{template.name} - Assignments</h1>
        <p className="text-muted-foreground">
          Configure when and where this {template.type} template should be displayed
        </p>
      </div>

      <AssignmentManager
        websiteId={websiteId}
        templateId={templateId}
        template={template}
        initialAssignments={templateAssignments}
        availablePages={pages}
      />
    </div>
  );
}


