import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageInfoCardProps {
  page: any;
  sectionsCount: number;
}

export function PageInfoCard({ page, sectionsCount }: PageInfoCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Page Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Name:</strong> {page?.name}
          </div>
          <div>
            <strong>Status:</strong> {page?.status}
          </div>
          <div>
            <strong>Slug:</strong> /{page?.slug}
          </div>
          <div>
            <strong>Website:</strong> {page?.cms_websites?.name} ({page?.cms_websites?.domain})
          </div>
          {page?.description && (
            <div className="md:col-span-3">
              <strong>Description:</strong> {page.description}
            </div>
          )}
          <div>
            <strong>Created:</strong> {page?.created_at ? new Date(page.created_at).toLocaleDateString() : "Unknown"}
          </div>
          <div>
            <strong>Updated:</strong> {page?.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Never"}
          </div>
          <div>
            <strong>Sections:</strong> {sectionsCount}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 