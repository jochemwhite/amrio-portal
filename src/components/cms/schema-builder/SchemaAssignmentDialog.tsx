"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/supabaseClient";
import { toast } from "sonner";

interface Schema {
  id: string;
  name: string;
  description: string | null;
  template: boolean;
  created_at: string;
  updated_at: string;
}

interface SchemaAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  currentSchemaId?: string | null;
  onSchemaAssigned: () => void;
}

export function SchemaAssignmentDialog({
  open,
  onOpenChange,
  pageId,
  currentSchemaId,
  onSchemaAssigned
}: SchemaAssignmentDialogProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(currentSchemaId || "");
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load schemas when dialog opens
  const loadSchemas = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cms_schemas')
        .select('id, name, description, template, created_at, updated_at')
        .order('name');

      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      console.error('Error loading schemas:', error);
      toast.error('Failed to load schemas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      loadSchemas();
    }
  };

  const handleAssignSchema = async () => {
    if (!selectedSchemaId) return;

    setIsAssigning(true);
    try {
      const supabase = createClient();

      // Update page with new schema
      const { error: updateError } = await supabase
        .from('cms_pages')
        .update({ schema_id: selectedSchemaId })
        .eq('id', pageId);

      if (updateError) throw updateError;

      // Initialize content fields from schema
      const { error: initError } = await supabase.rpc('initialize_page_content', {
        page_id_param: pageId,
        schema_id_param: selectedSchemaId
      });

      if (initError) throw initError;

      toast.success('Schema assigned and content initialized successfully');
      onSchemaAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning schema:', error);
      toast.error('Failed to assign schema');
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedSchema = schemas.find(s => s.id === selectedSchemaId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Schema to Page</DialogTitle>
          <DialogDescription>
            Choose a schema to apply to this page. This will create content fields based on the schema structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading schemas...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Schema</label>
                <Select value={selectedSchemaId} onValueChange={setSelectedSchemaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a schema..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schemas.map((schema) => (
                      <SelectItem key={schema.id} value={schema.id}>
                        <div className="flex items-center gap-2">
                          <span>{schema.name}</span>
                          {schema.template && (
                            <Badge variant="secondary" className="text-xs">
                              Template
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSchema && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm">{selectedSchema.name}</h4>
                    {selectedSchema.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSchema.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {selectedSchema.template && (
                        <Badge variant="outline" className="text-xs">
                          Template Schema
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Updated: {new Date(selectedSchema.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {currentSchemaId && selectedSchemaId !== currentSchemaId && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This page currently has a different schema assigned. 
                        Assigning a new schema will initialize new content fields.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!currentSchemaId && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        This page doesn't have a schema assigned yet. 
                        Assigning a schema will create the content structure.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignSchema}
            disabled={!selectedSchemaId || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Schema'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
