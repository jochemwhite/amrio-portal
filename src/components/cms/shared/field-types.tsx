import { FieldType } from "@/types/cms";
import { Calendar, FileText, FolderOpen, Hash, Image, Link, ToggleLeft, Type, Video } from "lucide-react";
import Boolean from "../content-editor/components/Boolean";
import Date from "../content-editor/components/Date";
import ImageComponent from "../content-editor/components/Image";
import Reference from "../content-editor/components/Reference";
import RichText from "../content-editor/components/RichText";
import SectionField from "../content-editor/components/SectionField";
import Text from "../content-editor/components/Text";
import YoutubeVideo from "../content-editor/components/Video";

export const FIELD_TYPES: FieldType[] = [
  {
    value: "text",
    label: "Text",
    icon: <Type className="h-4 w-4" />,
    description: "Simple text input",
    color: "bg-blue-100 text-blue-800",
    cmsComponent: Text,
  },
  {
    value: "richtext",
    label: "Rich Text",
    icon: <FileText className="h-4 w-4" />,
    description: "WYSIWYG editor",
    color: "bg-indigo-100 text-indigo-800",
    cmsComponent: RichText,
  },
  {
    value: "boolean",
    label: "Checkbox",
    icon: <ToggleLeft className="h-4 w-4" />,
    description: "True/false toggle",
    color: "bg-purple-100 text-purple-800",
    cmsComponent: Boolean,
  },
  {
    value: "date",
    label: "Date",
    icon: <Calendar className="h-4 w-4" />,
    description: "Date picker",
    color: "bg-orange-100 text-orange-800",
    cmsComponent: Date,
  },
  {
    value: "image",
    label: "Image",
    icon: <Image className="h-4 w-4" />,
    description: "Image upload",
    color: "bg-pink-100 text-pink-800",
    cmsComponent: ImageComponent,
  },
  {
    value: "reference",
    label: "Collection Reference",
    icon: <Link className="h-4 w-4" />,
    description: "Reference to collection content",
    color: "bg-yellow-100 text-yellow-800",
    cmsComponent: Reference,
  },
  {
    value: "video",
    label: "Video",
    icon: <Video className="h-4 w-4" />,
    description: "Video upload",
    color: "bg-red-100 text-red-800",
    cmsComponent: YoutubeVideo,
  },
  {
    value: "section",
    label: "Nested Section",
    icon: <FolderOpen className="h-4 w-4" />,
    description: "Embed another section within this section",
    color: "bg-slate-100 text-slate-800",
    cmsComponent: SectionField,
  },
];

export const getFieldIcon = (type: string): React.ReactNode => {
  const fieldType = FIELD_TYPES.find((ft) => ft.value === type);
  return fieldType?.icon || <Type className="h-4 w-4" />;
};

export const getFieldTypeLabel = (type: string): string => {
  const fieldType = FIELD_TYPES.find((ft) => ft.value === type);
  return fieldType?.label || type;
};

export const getFieldTypeColor = (type: string): string => {
  const fieldType = FIELD_TYPES.find((ft) => ft.value === type);
  return fieldType?.color || "bg-gray-100 text-gray-800";
};

export const getFieldTypeDescription = (type: string): string => {
  const fieldType = FIELD_TYPES.find((ft) => ft.value === type);
  return fieldType?.description || "";
};

// Validation helpers
export const validateFieldName = (name: string): string | null => {
  if (!name.trim()) return "Field name is required";
  if (name.length < 2) return "Field name must be at least 2 characters";
  if (name.length > 50) return "Field name must be less than 50 characters";
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) return "Field name must start with a letter and contain only letters, numbers, and underscores";
  return null;
};

export const validateFieldType = (type: string): string | null => {
  if (!type) return "Field type is required";
  if (!FIELD_TYPES.some((ft) => ft.value === type)) return "Invalid field type";
  return null;
};
