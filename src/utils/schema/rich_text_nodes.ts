export type RichTextAllowedNode =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "superscript"
  | "subscript"
  | "textColor"
  | "highlight"
  | "textSize"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock"
  | "horizontalRule"
  | "hardBreak"
  | "textAlign"
  | "image"
  | "youtube"
  | "table"
  | "link"

type RichTextNodeOption = {
  key: RichTextAllowedNode
  label: string
  description: string
}

type RichTextNodeGroup = {
  title: string
  options: RichTextNodeOption[]
}

export const RICH_TEXT_ALLOWED_NODE_GROUPS: RichTextNodeGroup[] = [
  {
    title: "Text Formatting",
    options: [
      { key: "bold", label: "Bold", description: "Allow bold text." },
      { key: "italic", label: "Italic", description: "Allow italic text." },
      { key: "underline", label: "Underline", description: "Allow underlined text." },
      { key: "strikethrough", label: "Strikethrough", description: "Allow struck-through text." },
      { key: "superscript", label: "Superscript", description: "Raise text above the baseline." },
      { key: "subscript", label: "Subscript", description: "Lower text below the baseline." },
      { key: "textColor", label: "Text Color", description: "Apply text colors." },
      { key: "highlight", label: "Highlight", description: "Highlight selected text." },
      { key: "textSize", label: "Text Size", description: "Change text size presets." },
    ],
  },
  {
    title: "Structure",
    options: [
      { key: "heading", label: "Heading", description: "Enable headings with levels 1 to 3." },
      { key: "bulletList", label: "Bullet List", description: "Create unordered lists." },
      { key: "orderedList", label: "Ordered List", description: "Create numbered lists." },
      { key: "blockquote", label: "Blockquote", description: "Format quote blocks." },
      { key: "codeBlock", label: "Code Block", description: "Add fenced code blocks." },
      { key: "horizontalRule", label: "Horizontal Rule", description: "Insert divider lines." },
      { key: "hardBreak", label: "Hard Break", description: "Allow Shift+Enter line breaks." },
    ],
  },
  {
    title: "Alignment",
    options: [
      { key: "textAlign", label: "Text Alignment", description: "Align paragraphs and headings." },
    ],
  },
  {
    title: "Media",
    options: [
      { key: "image", label: "Image", description: "Insert images from your media library." },
      { key: "youtube", label: "YouTube", description: "Embed YouTube videos." },
    ],
  },
  {
    title: "Layout",
    options: [
      { key: "table", label: "Table", description: "Insert basic tables." },
    ],
  },
  {
    title: "Links",
    options: [
      { key: "link", label: "Link", description: "Insert and edit hyperlinks." },
    ],
  },
]

export const RICH_TEXT_ALLOWED_NODE_OPTIONS = RICH_TEXT_ALLOWED_NODE_GROUPS.flatMap(
  (group) => group.options
)

const richTextAllowedNodeSet = new Set<string>(
  RICH_TEXT_ALLOWED_NODE_OPTIONS.map((option) => option.key)
)

export function normalizeRichTextAllowedNodes(value: unknown): RichTextAllowedNode[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (candidate): candidate is RichTextAllowedNode =>
      typeof candidate === "string" && richTextAllowedNodeSet.has(candidate)
  )
}

export function getRichTextAllowedNodesFromSettings(
  settings: Record<string, unknown> | null | undefined
): RichTextAllowedNode[] {
  return normalizeRichTextAllowedNodes(settings?.allowedNodes)
}
