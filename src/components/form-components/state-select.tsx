import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { State } from "@/types/api/countriesnow";
import React from "react";

interface StateSelectProps {
  onChange: (value: string) => void;
  value: string;
  states: State[];
  loading?: boolean;
}

export const StateSelect = ({ onChange, value, states, loading }: StateSelectProps) => {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filteredStates = states.filter((state) => state.name.toLowerCase().includes(search.toLowerCase()));
  const selectedState = states.find((state) => state.state_code === value);

  return (
    <Select value={value} open={open} onOpenChange={setOpen}>
      <SelectTrigger>
        <SelectValue placeholder="Select a state">{selectedState?.name || "Select a state"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <Command shouldFilter={false} className="p-0">
          <CommandInput placeholder="Search states..." value={search} onValueChange={setSearch} autoFocus />
          <CommandList>
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No states found.</CommandEmpty>
                {filteredStates.map((state) => (
                  <CommandItem
                    key={state.state_code}
                    value={state.state_code}
                    onSelect={() => {
                      onChange(state.state_code);
                      setOpen(false);
                    }}
                  >
                    {state.name}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
};
