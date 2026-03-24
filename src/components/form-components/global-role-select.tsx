import React from "react";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../ui/select";
import { createClient } from "@/lib/supabase/supabaseClient";
import type { AvailableRole } from "@/types/custom-supabase-types";
export interface GlobalRoleSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const GlobalRoleSelect: React.FC<GlobalRoleSelectProps> = ({ value, onChange, placeholder }) => {
  const [availableRoles, setAvailableRoles] = React.useState<AvailableRole[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const fetchRoles = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("global_role_types")
        .select("id, role_name, description")
        .order("role_name", { ascending: true });

      if (error || cancelled) return;
      setAvailableRoles((data ?? []) as AvailableRole[]);
    };

    void fetchRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRoles =
    availableRoles;

  const selectedRole = availableRoles.find((r) => r.id === value);

  const handleChange = (uuid: string) => {
    onChange(uuid);
    setOpen(false);
  };

  return (
    <Select
      value={value}
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
      onValueChange={handleChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder || "Select a role"} />
      </SelectTrigger>
      <SelectContent>
        {filteredRoles.map((role) => (
          <SelectItem key={role.id} value={role.id} >
            {role.role_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
