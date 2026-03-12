import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/supabaseClient";
import React, { useEffect } from "react";
import UserSheet from "@/components/admin/sheets/user-sheet";
import { User, Plus, Search } from "lucide-react";

export interface UserSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, placeholder }) => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("users").select("id, first_name, last_name, email").order("first_name", { ascending: true });
      if (error) throw error;
      setUsers(data || []);
      setFetched(true);
    } catch (e) {
      // Optionally handle error
    }
    setLoading(false);
  };

  // Filter users by search
  const filteredUsers =
    search.trim().length === 0
      ? users
      : users.filter((user) => `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(search.toLowerCase()));

  const selectedUser = users.find((u) => u.id === value);

  const openSheet = async (id: string) => {
    onChange(id);
    setSheetOpen(true);
  };

  const handleSuccess = async (id: string) => {
    await fetchUsers();
    onChange(id);
    setSheetOpen(false);
    setOpen(false);
  };

  return (
    <>
      <Select
        value={value}
        open={open}
        onOpenChange={async (open) => {
          if (open && !fetched) {
            await fetchUsers();
          }
          setOpen(open);
        }}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || "Select a user"}>
              {selectedUser ? (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {`${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.email})`}
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <Command shouldFilter={false} className="p-0">
            <div className="flex items-center px-2 py-2 gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <CommandInput placeholder="Search users..." value={search} onValueChange={setSearch} autoFocus className="flex-1" />
            </div>
            <CommandList>
              {loading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No users found.</CommandEmpty>
                  {filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        onChange(user.id);
                        setOpen(false);
                        setSheetOpen(false);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.first_name} {user.last_name} ({user.email})
                      </span>
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="__create_new__"
                    className="text-primary font-semibold border-t mt-2 pt-2"
                    onSelect={(id: string) => {
                      console.log("create new user", id);
                      openSheet(id);
                      setOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      + Create new user…
                    </span>
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </SelectContent>
      </Select>

      <UserSheet
        sheetOpen={sheetOpen}
        setSheetOpen={setSheetOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
};
