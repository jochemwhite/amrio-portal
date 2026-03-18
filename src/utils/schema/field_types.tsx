import type { ComponentType, ReactNode } from "react"
import type { FieldComponentProps } from "@/stores/content-editor-store"
import {
  Calendar,
  CircleDot,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link,
  Menu,
  Share2,
  ToggleLeft,
  Type,
  Video,
} from "lucide-react"
import * as cmsComponents from "@/components/cms/content-editor/components"
import { ReferenceSettings } from "@/components/cms/schema_builder/field_settings/reference_settings"
import { SocialMediaSettings } from "@/components/cms/schema_builder/field_settings/social_media_settings"

const EmptyCMSComponent: ComponentType<FieldComponentProps> = () => null

export type SchemaFieldType = {
  value: string
  label: string
  icon: ReactNode
  description: string
  color: string
  cmsComponent?: ComponentType<FieldComponentProps>
  settingsComponent?: ComponentType<{
    value: Record<string, unknown> | null
    setValue: (value: Record<string, unknown> | null) => void
    open?: boolean
    collectionId?: string | null
    setCollectionId?: (value: string | null) => void
    error?: string | null
    onCollectionTouched?: () => void
  }>
}

export const FIELD_TYPES: SchemaFieldType[] = [
  {
    value: "text",
    label: "Text",
    icon: <Type className="h-4 w-4" />,
    description: "Simple text input",
    color: "bg-blue-100 text-blue-800",
    cmsComponent: cmsComponents.TextComponent,
  },
  {
    value: "richtext",
    label: "Rich Text",
    icon: <FileText className="h-4 w-4" />,
    description: "WYSIWYG editor",
    color: "bg-indigo-100 text-indigo-800",
    cmsComponent: cmsComponents.RichTextComponent,
  },
  {
    value: "boolean",
    label: "Checkbox",
    icon: <CircleDot className="h-4 w-4" />,
    description: "True/false toggle",
    color: "bg-purple-100 text-purple-800",
    cmsComponent: cmsComponents.BooleanComponent,
  },
  {
    value: "button",
    label: "Button",
    icon: <ToggleLeft className="h-4 w-4" />,
    description: "A button",
    color: "bg-purple-100 text-purple-800",
    cmsComponent: cmsComponents.ButtonComponent,
  },
  {
    value: "date",
    label: "Date",
    icon: <Calendar className="h-4 w-4" />,
    description: "Date picker",
    color: "bg-orange-100 text-orange-800",
    cmsComponent: cmsComponents.DateComponent,
  },
  {
    value: "image",
    label: "Image",
    icon: <ImageIcon className="h-4 w-4" />,
    description: "Image upload",
    color: "bg-pink-100 text-pink-800",
    cmsComponent: cmsComponents.ImageComponent,
  },
  {
    value: "reference",
    label: "Collection Reference",
    icon: <Link className="h-4 w-4" />,
    description: "Reference to collection content",
    color: "bg-yellow-100 text-yellow-800",
    cmsComponent: cmsComponents.ReferenceComponent,
    settingsComponent: ReferenceSettings,
  },
  {
    value: "video",
    label: "Video",
    icon: <Video className="h-4 w-4" />,
    description: "Video upload",
    color: "bg-red-100 text-red-800",
    cmsComponent: cmsComponents.VideoComponent,
  },
  {
    value: "section",
    label: "Nested Section",
    icon: <FolderOpen className="h-4 w-4" />,
    description: "Embed another section within this section",
    color: "bg-slate-100 text-slate-800",
    cmsComponent: cmsComponents.SectionFieldComponent,
  },
  {
    value: "social_media",
    label: "Social Media",
    icon: <Share2 className="h-4 w-4" />,
    description: "Social media links array",
    color: "bg-cyan-100 text-cyan-800",
    cmsComponent: cmsComponents.SocialMediaComponent,
    settingsComponent: SocialMediaSettings,
  },
  {
    value: "navigation_menu",
    label: "Navigation Menu",
    icon: <Menu className="h-4 w-4" />,
    description: "Navigation menu with nested items",
    color: "bg-emerald-100 text-emerald-800",
    cmsComponent: EmptyCMSComponent,
  },
]

export function get_field_icon(type: string): ReactNode {
  const fieldType = FIELD_TYPES.find((candidate) => candidate.value === type)
  return fieldType?.icon ?? <Type className="h-4 w-4" />
}

export function get_field_type_label(type: string): string {
  const fieldType = FIELD_TYPES.find((candidate) => candidate.value === type)
  return fieldType?.label ?? type
}

export function get_field_type_color(type: string): string {
  const fieldType = FIELD_TYPES.find((candidate) => candidate.value === type)
  return fieldType?.color ?? "bg-gray-100 text-gray-800"
}

export function get_field_type_description(type: string): string {
  const fieldType = FIELD_TYPES.find((candidate) => candidate.value === type)
  return fieldType?.description ?? ""
}
