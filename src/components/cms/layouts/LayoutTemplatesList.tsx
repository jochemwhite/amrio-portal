"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LayoutTemplate, LayoutTemplateType } from "@/types/cms";
import { LayoutTemplateCard } from "./LayoutTemplateCard";
import { CreateLayoutTemplateDialog } from "./CreateLayoutTemplateDialog";

interface LayoutTemplatesListProps {
  websiteId: string;
  initialHeaders: LayoutTemplate[];
  initialFooters: LayoutTemplate[];
}

export function LayoutTemplatesList({
  websiteId,
  initialHeaders,
  initialFooters,
}: LayoutTemplatesListProps) {
  const [headers, setHeaders] = useState<LayoutTemplate[]>(initialHeaders);
  const [footers, setFooters] = useState<LayoutTemplate[]>(initialFooters);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<LayoutTemplateType>("header");

  const handleCreateClick = (type: LayoutTemplateType) => {
    setCreateType(type);
    setIsCreateDialogOpen(true);
  };

  const handleTemplateCreated = (newTemplate: LayoutTemplate) => {
    if (newTemplate.type === "header") {
      setHeaders([...headers, newTemplate]);
    } else {
      setFooters([...footers, newTemplate]);
    }
  };

  const handleTemplateDeleted = (templateId: string, type: LayoutTemplateType) => {
    if (type === "header") {
      setHeaders(headers.filter((t) => t.id !== templateId));
    } else {
      setFooters(footers.filter((t) => t.id !== templateId));
    }
  };

  const handleTemplateUpdated = (updatedTemplate: LayoutTemplate) => {
    if (updatedTemplate.type === "header") {
      setHeaders(headers.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    } else {
      setFooters(footers.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    }
  };

  return (
    <>
      <Tabs defaultValue="headers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="headers">Headers ({headers.length})</TabsTrigger>
          <TabsTrigger value="footers">Footers ({footers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="headers" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Create and manage header templates for your website
            </p>
            <Button onClick={() => handleCreateClick("header")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Header
            </Button>
          </div>

          {headers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No headers yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first header template to get started
              </p>
              <Button onClick={() => handleCreateClick("header")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Header
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {headers.map((template) => (
                <LayoutTemplateCard
                  key={template.id}
                  template={template}
                  websiteId={websiteId}
                  onDeleted={handleTemplateDeleted}
                  onUpdated={handleTemplateUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="footers" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Create and manage footer templates for your website
            </p>
            <Button onClick={() => handleCreateClick("footer")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Footer
            </Button>
          </div>

          {footers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No footers yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first footer template to get started
              </p>
              <Button onClick={() => handleCreateClick("footer")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Footer
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {footers.map((template) => (
                <LayoutTemplateCard
                  key={template.id}
                  template={template}
                  websiteId={websiteId}
                  onDeleted={handleTemplateDeleted}
                  onUpdated={handleTemplateUpdated}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateLayoutTemplateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        websiteId={websiteId}
        type={createType}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}


