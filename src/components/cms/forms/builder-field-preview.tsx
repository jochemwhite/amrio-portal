"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BuilderField } from "./headless-form-designer";

interface BuilderFieldPreviewProps {
  field: BuilderField;
}

function FieldShell({
  field,
  children,
  className,
}: {
  field: BuilderField;
  children: ReactNode;
  className?: string;
}) {
  if (field.type === "heading") {
    const headingLevel = Math.min(Math.max(field.headingLevel ?? 2, 1), 6);
    const headingClassName = "font-semibold tracking-tight text-foreground";

    if (headingLevel === 1) return <h1 className={headingClassName}>{field.label}</h1>;
    if (headingLevel === 2) return <h2 className={headingClassName}>{field.label}</h2>;
    if (headingLevel === 3) return <h3 className={headingClassName}>{field.label}</h3>;
    if (headingLevel === 4) return <h4 className={headingClassName}>{field.label}</h4>;
    if (headingLevel === 5) return <h5 className={headingClassName}>{field.label}</h5>;
    return <h6 className={headingClassName}>{field.label}</h6>;
  }

  if (field.type === "paragraph") {
    return <p className="text-sm leading-6 text-muted-foreground">{field.content || "Paragraph content"}</p>;
  }

  if (field.type === "divider") {
    return <Separator className="my-1" />;
  }

  if (field.type === "section") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-semibold text-foreground">{field.label}</p>
        {field.helpText ? <p className="mt-1 text-sm text-muted-foreground">{field.helpText}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-foreground">
        {field.label}
        {field.required ? <span className="ml-1">*</span> : null}
      </Label>
      {children}
      {field.helpText ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null}
    </div>
  );
}

function MultiSelectPreview({ field }: { field: BuilderField }) {
  return (
    <select
      multiple
      className="min-h-28 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none"
      defaultValue={(field.options ?? []).slice(0, Math.min(2, (field.options ?? []).length))}
    >
      {(field.options ?? []).map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function FileUploadPreview({ field }: { field: BuilderField }) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <div className="space-y-2">
      <Input
        type="file"
        multiple={field.multiple}
        accept={field.accept}
        onChange={(event) => {
          const fileNames = Array.from(event.target.files ?? []).map((file) => file.name);
          setSelectedFiles(fileNames);
        }}
      />
      {selectedFiles.length > 0 ? (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {selectedFiles.join(", ")}
        </div>
      ) : null}
    </div>
  );
}

function DateRangePreview({ field }: { field: BuilderField }) {
  const [value, setValue] = useState({ start: "", end: "" });

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="date"
        min={field.minDate}
        max={field.maxDate}
        value={value.start}
        onChange={(event) => setValue((current) => ({ ...current, start: event.target.value }))}
      />
      <Input
        type="date"
        min={field.minDate || value.start}
        max={field.maxDate}
        value={value.end}
        onChange={(event) => setValue((current) => ({ ...current, end: event.target.value }))}
      />
    </div>
  );
}

function RangeSliderPreview({ field }: { field: BuilderField }) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const initialValue = useMemo(() => [Math.min(Math.max(min, min + step * 2), max)], [max, min, step]);
  const [value, setValue] = useState(initialValue);

  return (
    <div className="space-y-2">
      <Slider min={min} max={max} step={step} value={value} onValueChange={setValue} />
      <p className="text-xs text-muted-foreground">
        Value: {value[0]} ({min} - {max})
      </p>
    </div>
  );
}

function RatingPreview({ field }: { field: BuilderField }) {
  const maxRating = Math.min(Math.max(field.maxRating ?? 5, 1), 10);
  const [value, setValue] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const ratingValue = index + 1;
        const filled = ratingValue <= value;

        return (
          <button
            key={ratingValue}
            type="button"
            className="rounded-sm p-1 text-muted-foreground transition hover:text-amber-500"
            onClick={() => setValue(ratingValue)}
            aria-label={`Set rating to ${ratingValue}`}
          >
            <Star className={cn("h-5 w-5", filled && "fill-amber-400 text-amber-400")} />
          </button>
        );
      })}
    </div>
  );
}

export function BuilderFieldPreview({ field }: BuilderFieldPreviewProps) {
  const fieldId = useId();

  if (field.type === "heading" || field.type === "paragraph" || field.type === "divider" || field.type === "section") {
    return <FieldShell field={field}>{null}</FieldShell>;
  }

  if (field.type === "textarea") {
    return (
      <FieldShell field={field}>
        <Textarea placeholder={field.placeholder || "Value here..."} />
      </FieldShell>
    );
  }

  if (field.type === "checkbox") {
    return (
      <FieldShell field={field}>
        <div className="flex items-center gap-2">
          <Checkbox id={fieldId} />
          <Label htmlFor={fieldId} className="text-sm font-normal text-muted-foreground">
            {field.placeholder || "Check to confirm"}
          </Label>
        </div>
      </FieldShell>
    );
  }

  if (field.type === "toggle") {
    return (
      <FieldShell field={field}>
        <div className="flex items-center gap-3">
          <Switch id={fieldId} />
          <Label htmlFor={fieldId} className="text-sm font-normal text-muted-foreground">
            {field.placeholder || "Enable option"}
          </Label>
        </div>
      </FieldShell>
    );
  }

  if (field.type === "select") {
    return (
      <FieldShell field={field}>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>
    );
  }

  if (field.type === "multiselect") {
    return (
      <FieldShell field={field}>
        <MultiSelectPreview field={field} />
      </FieldShell>
    );
  }

  if (field.type === "radio") {
    return (
      <FieldShell field={field}>
        <RadioGroup defaultValue={(field.options ?? [])[0]}>
          {(field.options ?? []).map((option) => {
            const optionId = `${fieldId}-${option}`;
            return (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem id={optionId} value={option} />
                <Label htmlFor={optionId} className="text-sm font-normal text-foreground">
                  {option}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </FieldShell>
    );
  }

  if (field.type === "file") {
    return (
      <FieldShell field={field}>
        <FileUploadPreview field={field} />
      </FieldShell>
    );
  }

  if (field.type === "dateRange") {
    return (
      <FieldShell field={field}>
        <DateRangePreview field={field} />
      </FieldShell>
    );
  }

  if (field.type === "range") {
    return (
      <FieldShell field={field}>
        <RangeSliderPreview field={field} />
      </FieldShell>
    );
  }

  if (field.type === "rating") {
    return (
      <FieldShell field={field}>
        <RatingPreview field={field} />
      </FieldShell>
    );
  }

  return (
    <FieldShell field={field}>
      <Input
        type={
          field.type === "email" ||
          field.type === "number" ||
          field.type === "password" ||
          field.type === "url" ||
          field.type === "date" ||
          field.type === "time" ||
          field.type === "phone"
            ? field.type === "phone"
              ? "tel"
              : field.type
            : "text"
        }
        placeholder={field.placeholder || "Value here..."}
        min={field.type === "number" ? field.min : field.type === "date" ? field.minDate : undefined}
        max={field.type === "number" ? field.max : field.type === "date" ? field.maxDate : undefined}
        step={field.type === "number" ? field.step : undefined}
        pattern={field.type === "phone" ? "^[0-9+()\\-\\s]+$" : undefined}
        minLength={field.type === "password" ? 8 : undefined}
      />
    </FieldShell>
  );
}
