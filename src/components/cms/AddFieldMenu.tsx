"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { Card } from "../ui/card";

interface FieldType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

interface AddFieldMenuProps {
  onAddField: (fieldData: any) => void;
  onClose: () => void;
  fieldTypes: FieldType[];
}

export function AddFieldMenu({ onAddField, onClose, fieldTypes }: AddFieldMenuProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [fieldData, setFieldData] = useState({
    name: "",
    type: "",
    required: false,
    default_value: "",
    validation: "",
  });

  const handleTypeSelect = (type: FieldType) => {
    setSelectedType(type.value);
    setFieldData((prev) => ({ ...prev, type: type.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldData.name.trim() || !fieldData.type) return;

    onAddField(fieldData);
    setFieldData({
      name: "",
      type: "",
      required: false,
      default_value: "",
      validation: "",
    });
    setSelectedType(null);
  };

  const handleCancel = () => {
    setFieldData({
      name: "",
      type: "",
      required: false,
      default_value: "",
      validation: "",
    });
    setSelectedType(null);
    onClose();
  };

  if (!selectedType) {
    return (
      <Card className="p-4 ">
        <div className="flex items-center justify-between mb-4 p-2 rounded-lg">
          <h3 className="text-sm font-medium ">Choose Field Type</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {fieldTypes.map((type) => (
            <button key={type.value} onClick={() => handleTypeSelect(type)} className="flex items-center space-x-3 p-3 text-left border  rounded-lg ">
              <span className="text-lg">{type.icon}</span>
              <div>
                <div className="font-medium ">{type.label}</div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const selectedTypeInfo = fieldTypes.find((t) => t.value === selectedType);

  return (
    <Card className=" ">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selectedTypeInfo?.icon}</span>
          <h3 className="text-sm font-medium text-gray-900">Add {selectedTypeInfo?.label} Field</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="field-name" className="text-sm font-medium">
            Field Name *
          </Label>
          <Input
            id="field-name"
            value={fieldData.name}
            onChange={(e) => setFieldData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter field name"
            className="mt-1"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="field-required" checked={fieldData.required} onCheckedChange={(required) => setFieldData((prev) => ({ ...prev, required }))} />
          <Label htmlFor="field-required" className="text-sm">
            Required field
          </Label>
        </div>

        {selectedType !== "boolean" && (
          <div>
            <Label htmlFor="field-default" className="text-sm font-medium">
              Default Value
            </Label>
            <Input
              id="field-default"
              value={fieldData.default_value}
              onChange={(e) => setFieldData((prev) => ({ ...prev, default_value: e.target.value }))}
              placeholder="Enter default value (optional)"
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label htmlFor="field-validation" className="text-sm font-medium">
            Validation Rules
          </Label>
          <Textarea
            id="field-validation"
            value={fieldData.validation}
            onChange={(e) => setFieldData((prev) => ({ ...prev, validation: e.target.value }))}
            placeholder="Enter validation rules (optional)"
            className="mt-1"
            rows={2}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">Add Field</Button>
        </div>
      </form>
    </Card>
  );
}
