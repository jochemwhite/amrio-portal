"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  archiveForm,
  CmsForm,
  CmsFormStats,
  createFormForActiveWebsite,
  setFormPublishedState,
} from "@/actions/cms/form-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSession } from "@/providers/session-provider";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FormsOverviewProps {
  initialForms: CmsForm[];
  initialStats: CmsFormStats;
}

export function FormsOverview({ initialForms, initialStats }: FormsOverviewProps) {
  const [forms, setForms] = useState<CmsForm[]>(initialForms);
  const [stats, setStats] = useState<CmsFormStats>(initialStats);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const { userSession } = useUserSession();

  const isSystemAdmin = useMemo(
    () => userSession?.global_roles?.some((role) => role === "system_admin") ?? false,
    [userSession?.global_roles],
  );

  const publishedCount = useMemo(() => forms.filter((form) => form.published).length, [forms]);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createFormForActiveWebsite({
        name,
        description,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to create form");
        return;
      }

      setForms((prev) => [result.data!, ...prev]);
      toast.success("Form created");
      setIsCreateOpen(false);
      resetForm();
    });
  };

  const handleTogglePublish = (form: CmsForm) => {
    startTransition(async () => {
      const result = await setFormPublishedState(form.id, !form.published);
      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to update publish state");
        return;
      }

      setForms((prev) => prev.map((item) => (item.id === form.id ? result.data! : item)));
      toast.success(result.data.published ? "Form published" : "Form moved to draft");
    });
  };

  const handleArchive = (form: CmsForm) => {
    startTransition(async () => {
      const result = await archiveForm(form.id);
      if (!result.success) {
        toast.error(result.error || "Failed to archive form");
        return;
      }

      setForms((prev) => prev.filter((item) => item.id !== form.id));
      setStats((prev) => ({
        ...prev,
        visits: Math.max(0, prev.visits - form.visits),
        submissions: Math.max(0, prev.submissions - form.submissions),
      }));
      toast.success("Form archived");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">Manage headless form definitions and publishing state.</p>
        </div>
        {isSystemAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Forms</CardDescription>
            <CardTitle className="text-2xl">{forms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl">{publishedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visits</CardDescription>
            <CardTitle className="text-2xl">{stats.visits}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submissions</CardDescription>
            <CardTitle className="text-2xl">{stats.submissions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Definitions</CardTitle>
          <CardDescription>Open a form in builder mode to edit fields and structure.</CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No forms yet. Create one to start building.</p>
          ) : (
            <div className="space-y-3">
              {forms.map((form) => (
                <div key={form.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{form.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{form.description || "No description"}</p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {form.submissions} submissions / {form.visits} visits
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={form.published ? "default" : "secondary"}>
                      {form.published ? "Published" : "Draft"}
                    </Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/forms/${form.id}`}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Builder
                      </Link>
                    </Button>
                    {isSystemAdmin && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleTogglePublish(form)} disabled={isPending}>
                          {form.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleArchive(form)}
                          disabled={isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Archive
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Form</DialogTitle>
            <DialogDescription>Create a new form definition for the active website.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="form-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="form-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Lead Capture"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="form-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="form-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Used for homepage demo request CTA"
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || name.trim().length < 2}>
                {isPending ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
