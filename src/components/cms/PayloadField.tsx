"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2, Type, Hash, ToggleLeft, Calendar, FileText, Image, Link } from "lucide-react";

interface PayloadFieldProps {
  field: any;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case "text":
      return <Type className="h-4 w-4" />;
    case "number":
      return <Hash className="h-4 w-4" />;
    case "boolean":
      return <ToggleLeft className="h-4 w-4" />;
    case "date":
      return <Calendar className="h-4 w-4" />;
    case "richtext":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "reference":
      return <Link className="h-4 w-4" />;
    default:
      return <Type className="h-4 w-4" />;
  }
};

const getFieldTypeLabel = (type: string) => {
  const types = {
    text: "Text",
    number: "Number",
    boolean: "Checkbox",
    date: "Date",
    richtext: "Rich Text",
    image: "Image",
    reference: "Relationship",
  };
  return types[type as keyof typeof types] || type;
};

const getFieldTypeColor = (type: string) => {
  const colors = {
    text: "bg-blue-100 text-blue-800",
    number: "bg-green-100 text-green-800",
    boolean: "bg-purple-100 text-purple-800",
    date: "bg-orange-100 text-orange-800",
    richtext: "bg-indigo-100 text-indigo-800",
    image: "bg-pink-100 text-pink-800",
    reference: "bg-yellow-100 text-yellow-800",
  };
  return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export function PayloadField({ field, isSaving, onEdit, onDelete }: PayloadFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg    ${isDragging ? "opacity-50 shadow-lg" : "hover:shadow-sm"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-gray-100 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 " />
          </div>

          <div className={`p-2 rounded-lg ${getFieldTypeColor(field.type)}`}>{getFieldIcon(field.type)}</div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium ">{field.name}</h4>
              {field.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">{getFieldTypeLabel(field.type)}</span>
              {field.default_value && (
                <>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-500">Default: {field.default_value}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit} disabled={isSaving} className="text-gray-500 hover:text-gray-700">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isSaving} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
