"use client"

import type { AnyExtension, JSONContent } from "@tiptap/core"
import Blockquote from "@tiptap/extension-blockquote"
import Bold from "@tiptap/extension-bold"
import BulletList from "@tiptap/extension-bullet-list"
import CodeBlock from "@tiptap/extension-code-block"
import Color from "@tiptap/extension-color"
import Document from "@tiptap/extension-document"
import Gapcursor from "@tiptap/extension-gapcursor"
import HardBreak from "@tiptap/extension-hard-break"
import Heading from "@tiptap/extension-heading"
import Highlight from "@tiptap/extension-highlight"
import History from "@tiptap/extension-history"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import Italic from "@tiptap/extension-italic"
import Link from "@tiptap/extension-link"
import ListItem from "@tiptap/extension-list-item"
import OrderedList from "@tiptap/extension-ordered-list"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Strike from "@tiptap/extension-strike"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import Text from "@tiptap/extension-text"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import Youtube from "@tiptap/extension-youtube"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
} from "lucide-react"

import type { RichTextAllowedNode } from "@/utils/schema/rich_text_nodes"
import { RichTextImage } from "./extensions/rich_text_image"
import { RichTextTextSize, TEXT_SIZE_PRESETS } from "./extensions/rich_text_text_size"

export { TEXT_SIZE_PRESETS }

export const TEXT_COLOR_PRESETS = [
  "#111827",
  "#374151",
  "#6B7280",
  "#DC2626",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#059669",
  "#0891B2",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#C026D3",
  "#DB2777",
  "#FFFFFF",
  "#000000",
]

export const HIGHLIGHT_PRESETS = [
  "#FEF08A",
  "#FDE68A",
  "#FDBA74",
  "#FCA5A5",
  "#F9A8D4",
  "#C4B5FD",
  "#93C5FD",
  "#67E8F9",
  "#86EFAC",
  "#D9F99D",
  "#E5E7EB",
  "#FDE68A",
]

export const ALIGNMENT_OPTIONS = [
  { key: "left", icon: AlignLeft, label: "Align left" },
  { key: "center", icon: AlignCenter, label: "Align center" },
  { key: "right", icon: AlignRight, label: "Align right" },
  { key: "justify", icon: AlignJustify, label: "Justify" },
] as const

export type ActiveState = {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrike: boolean
  isSuperscript: boolean
  isSubscript: boolean
  isBulletList: boolean
  isOrderedList: boolean
  isBlockquote: boolean
  isCodeBlock: boolean
  isLink: boolean
  isHeading1: boolean
  isHeading2: boolean
  isHeading3: boolean
  isTable: boolean
  currentImageAlign: "left" | "center" | "right" | "full"
  currentTextAlign: "left" | "center" | "right" | "justify"
  currentTextColor: string
  currentHighlightColor: string
  currentFontSize: string
}

export const DEFAULT_ACTIVE_STATE: ActiveState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isSuperscript: false,
  isSubscript: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
  isCodeBlock: false,
  isLink: false,
  isHeading1: false,
  isHeading2: false,
  isHeading3: false,
  isTable: false,
  currentImageAlign: "center",
  currentTextAlign: "left",
  currentTextColor: "",
  currentHighlightColor: "",
  currentFontSize: "",
}

export const EMPTY_RICH_TEXT_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

export function normalizeRichTextValue(value: unknown): JSONContent | string {
  if (value && typeof value === "object" && "type" in (value as Record<string, unknown>)) {
    return value as JSONContent
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  return EMPTY_RICH_TEXT_DOC
}

export function buildExtensions(
  allowedNodes: RichTextAllowedNode[],
  placeholder: string
): AnyExtension[] {
  const extensions: AnyExtension[] = [
    Document,
    Paragraph,
    Text,
    History,
    Gapcursor,
    Placeholder.configure({
      placeholder,
      emptyEditorClass: "is-editor-empty",
    }),
  ]

  if (allowedNodes.includes("heading")) {
    extensions.push(Heading.configure({ levels: [1, 2, 3] }))
  }
  if (allowedNodes.includes("bold")) extensions.push(Bold)
  if (allowedNodes.includes("italic")) extensions.push(Italic)
  if (allowedNodes.includes("underline")) extensions.push(Underline)
  if (allowedNodes.includes("strikethrough")) extensions.push(Strike)

  if (allowedNodes.includes("textColor") || allowedNodes.includes("textSize")) {
    extensions.push(TextStyle)
  }
  if (allowedNodes.includes("textColor")) {
    extensions.push(Color.configure({ types: ["textStyle"] }))
  }
  if (allowedNodes.includes("textSize")) extensions.push(RichTextTextSize)
  if (allowedNodes.includes("highlight")) {
    extensions.push(Highlight.configure({ multicolor: true }))
  }
  if (allowedNodes.includes("superscript")) extensions.push(Superscript)
  if (allowedNodes.includes("subscript")) extensions.push(Subscript)
  if (allowedNodes.includes("codeBlock")) extensions.push(CodeBlock)

  if (allowedNodes.includes("bulletList") || allowedNodes.includes("orderedList")) {
    extensions.push(ListItem)
  }
  if (allowedNodes.includes("bulletList")) {
    extensions.push(BulletList.configure({ HTMLAttributes: { class: "list-disc pl-5" } }))
  }
  if (allowedNodes.includes("orderedList")) {
    extensions.push(OrderedList.configure({ HTMLAttributes: { class: "list-decimal pl-5" } }))
  }

  if (allowedNodes.includes("blockquote")) extensions.push(Blockquote)
  if (allowedNodes.includes("link")) {
    extensions.push(Link.configure({ openOnClick: false, autolink: true }))
  }
  if (allowedNodes.includes("image")) {
    extensions.push(
      RichTextImage.configure({
        inline: false,
        allowBase64: false,
        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 120,
          minHeight: 80,
          alwaysPreserveAspectRatio: true,
        },
      })
    )
  }
  if (allowedNodes.includes("youtube")) {
    extensions.push(
      Youtube.configure({
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: "w-full aspect-video rounded-xl",
          sandbox: "allow-scripts allow-same-origin",
        },
      })
    )
  }
  if (allowedNodes.includes("table")) {
    extensions.push(
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    )
  }
  if (allowedNodes.includes("horizontalRule")) extensions.push(HorizontalRule)
  if (allowedNodes.includes("hardBreak")) extensions.push(HardBreak)
  if (allowedNodes.includes("textAlign")) {
    extensions.push(TextAlign.configure({ types: ["heading", "paragraph"] }))
  }

  return extensions
}
