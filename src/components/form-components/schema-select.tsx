import { createClient } from "@/lib/supabase/supabaseClient";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getActiveTenantId } from "@/server/utils";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { useUserSession } from "@/providers/session-provider";

interface SchemaSelectProps {
  value: string;
  onChange: (value: string) => void;
  type: "collection" | "page";
}

export const SchemaSelect = ({ value, onChange, type }: SchemaSelectProps) => {
  const [schemas, setSchemas] = useState<Array<{ id: string; name: string; description: string | null; template: boolean }>>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false);
  const { userSession } = useUserSession();
  // Load schemas function
  const loadSchemas = async () => {
    setIsLoadingSchemas(true);

    try {
      if (!userSession?.active_tenant) {
        throw new Error("No tenant selected");
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_schemas")
        .select("id, name, description, template")
        .order("name")
        .eq("tenant_id", userSession.active_tenant.id)
        .eq("schema_type", type);

      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      console.error("Error loading schemas:", error);
      toast.error("Failed to load schemas");
    } finally {
      setIsLoadingSchemas(false);
    }
  };

  useEffect(() => {
    loadSchemas();
  }, [userSession?.active_tenant]);

  return (
    <Select
      onValueChange={(value) => {
        onChange(value === "none" ? "" : value);
      }}
      value={value || "none"}
    >
      <SelectTrigger>
        <SelectValue placeholder="Choose a schema..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center">
            <span className="text-muted-foreground">No schema</span>
          </div>
        </SelectItem>
        {isLoadingSchemas ? (
          <SelectItem value="loading" disabled>
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading schemas...
            </div>
          </SelectItem>
        ) : (
          schemas.map((schema) => (
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
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SchemaSelect;
