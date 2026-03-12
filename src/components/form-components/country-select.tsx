import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountryPosition } from "@/types/api/countriesnow";
import React from "react";

interface CountrySelectProps {
  onChange: (value: string) => void;
  value: string;
  countries: CountryPosition[];
}

export const CountrySelect = ({ onChange, value, countries }: CountrySelectProps) => {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const filteredCountries = countries.filter((country) => country.name.toLowerCase().includes(search.toLowerCase()));
  const selectedCountry = countries.find((country) => country.iso2 === value);

  return (
    <Select value={value} open={open} onOpenChange={setOpen}>
      <SelectTrigger>
        <SelectValue placeholder="Select a country">{selectedCountry ? selectedCountry.name : "Select a country"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <Command shouldFilter={false} className="p-0">
          <CommandInput placeholder="Search users..." value={search} onValueChange={setSearch} autoFocus />
          <CommandList>
            <>
              <CommandEmpty>No countries found.</CommandEmpty>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.iso2}
                  value={country.iso2}
                  onSelect={() => {
                    onChange(country.iso2);
                    setOpen(false);
                  }}
                >
                  {country.name}
                </CommandItem>
              ))}
            </>
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
};
