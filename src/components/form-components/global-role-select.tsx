import { createClient } from "@/lib/supabase/supabaseClient";
import { AvailableRole } from "@/types/custom-supabase-types";
import React from "react";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../ui/select";
import { useUsers } from "@/providers/users-providers";
export interface GlobalRoleSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const GlobalRoleSelect: React.FC<GlobalRoleSelectProps> = ({ value, onChange, placeholder }) => {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { availableRoles } = useUsers();

  const filteredRoles =
    search.trim().length === 0
      ? availableRoles
      : availableRoles.filter((role) => role.role_name.toLowerCase().includes(search.toLowerCase()));

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
