import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldComponentProps } from "@/stores/useContentEditorStore";
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

export default function DateComponent({ field, fieldId, value, handleFieldChange }: FieldComponentProps) {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value.toString()) : undefined);
  const [open, setOpen] = useState(false);



  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        Date of birth
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date" className="w-48 justify-between font-normal">
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
              handleFieldChange(fieldId, date)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
