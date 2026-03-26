"use client"

import { useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold as BoldIcon,
  Code2,
  Expand,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic as ItalicIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Paintbrush,
  Pilcrow,
  Play,
  Quote,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table2,
  Type,
  Underline as UnderlineIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import type { RichTextAllowedNode } from "@/utils/schema/rich_text_nodes"
import {
  ALIGNMENT_OPTIONS,
  type ActiveState,
  HIGHLIGHT_PRESETS,
  TEXT_COLOR_PRESETS,
  TEXT_SIZE_PRESETS,
} from "./config"

export type SharedToolbarProps = {
  editor: Editor
  activeState: ActiveState
  normalizedAllowedNodes: RichTextAllowedNode[]
  onOpenLinkDialog: () => void
  onOpenImageDialog: () => void
}

export function Toolbar({
  editor,
  activeState,
  normalizedAllowedNodes,
  onOpenLinkDialog,
  onOpenImageDialog,
  fullscreen,
}: SharedToolbarProps & { fullscreen: boolean }) {
  const groups = [
    hasAny(normalizedAllowedNodes, [
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "textColor",
      "highlight",
    ])
      ? (
          <ToolbarGroup key="marks" fullscreen={fullscreen}>
            {normalizedAllowedNodes.includes("bold") ? (
              <ToolbarToggle pressed={activeState.isBold} onPressedChange={() => editor.chain().focus().toggleBold().run()} label="Bold" fullscreen={fullscreen}>
                <BoldIcon className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("italic") ? (
              <ToolbarToggle pressed={activeState.isItalic} onPressedChange={() => editor.chain().focus().toggleItalic().run()} label="Italic" fullscreen={fullscreen}>
                <ItalicIcon className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("underline") ? (
              <ToolbarToggle pressed={activeState.isUnderline} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} label="Underline" fullscreen={fullscreen}>
                <UnderlineIcon className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("strikethrough") ? (
              <ToolbarToggle pressed={activeState.isStrike} onPressedChange={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough" fullscreen={fullscreen}>
                <Strikethrough className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("textColor") ? (
              <ColorPopoverButton type="text" color={activeState.currentTextColor} onSelect={(color) => editor.chain().focus().setColor(color).run()} onClear={() => editor.chain().focus().unsetColor().run()} fullscreen={fullscreen} />
            ) : null}
            {normalizedAllowedNodes.includes("highlight") ? (
              <ColorPopoverButton type="highlight" color={activeState.currentHighlightColor} onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()} onClear={() => editor.chain().focus().unsetHighlight().run()} fullscreen={fullscreen} />
            ) : null}
          </ToolbarGroup>
        )
      : null,
    hasAny(normalizedAllowedNodes, ["heading", "textSize"])
      ? (
          <ToolbarGroup key="headings" fullscreen={fullscreen}>
            {normalizedAllowedNodes.includes("heading")
              ? [1, 2, 3].map((level) => (
                  <ToolbarToggle
                    key={level}
                    pressed={level === 1 ? activeState.isHeading1 : level === 2 ? activeState.isHeading2 : activeState.isHeading3}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
                    label={`Heading ${level}`}
                    fullscreen={fullscreen}
                  >
                    {level === 1 ? <Heading1 className="size-4" /> : level === 2 ? <Heading2 className="size-4" /> : <Heading3 className="size-4" />}
                  </ToolbarToggle>
                ))
              : null}
            {normalizedAllowedNodes.includes("textSize") ? (
              <TextSizePopoverButton
                activeSize={activeState.currentFontSize}
                onSelect={(size) => {
                  if (!size) {
                    editor.chain().focus().setMark("textStyle", { fontSize: null }).run()
                    editor.chain().focus().removeEmptyTextStyle().run()
                    return
                  }
                  editor.chain().focus().setMark("textStyle", { fontSize: size }).run()
                }}
                fullscreen={fullscreen}
              />
            ) : null}
          </ToolbarGroup>
        )
      : null,
    normalizedAllowedNodes.includes("textAlign")
      ? (
          <ToolbarGroup key="alignment" fullscreen={fullscreen}>
            {ALIGNMENT_OPTIONS.map((option) => (
              <ToolbarToggle
                key={option.key}
                pressed={activeState.currentTextAlign === option.key}
                onPressedChange={() => editor.chain().focus().setTextAlign(option.key).run()}
                label={option.label}
                fullscreen={fullscreen}
              >
                <option.icon className="size-4" />
              </ToolbarToggle>
            ))}
          </ToolbarGroup>
        )
      : null,
    hasAny(normalizedAllowedNodes, ["bulletList", "orderedList"])
      ? (
          <ToolbarGroup key="lists" fullscreen={fullscreen}>
            {normalizedAllowedNodes.includes("bulletList") ? (
              <ToolbarToggle pressed={activeState.isBulletList} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list" fullscreen={fullscreen}>
                <List className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("orderedList") ? (
              <ToolbarToggle pressed={activeState.isOrderedList} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} label="Ordered list" fullscreen={fullscreen}>
                <ListOrdered className="size-4" />
              </ToolbarToggle>
            ) : null}
          </ToolbarGroup>
        )
      : null,
    hasAny(normalizedAllowedNodes, ["link", "image", "youtube", "table", "horizontalRule", "hardBreak"])
      ? (
          <ToolbarGroup key="inserts" fullscreen={fullscreen}>
            {normalizedAllowedNodes.includes("link") ? (
              <ToolbarToggle pressed={activeState.isLink} onPressedChange={onOpenLinkDialog} label="Link" fullscreen={fullscreen}>
                <LinkIcon className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("image") ? (
              <ToolbarButton type="button" onMouseDown={(event) => event.preventDefault()} onClick={onOpenImageDialog} fullscreen={fullscreen}>
                <ImagePlus className="size-4" />
              </ToolbarButton>
            ) : null}
            {normalizedAllowedNodes.includes("youtube") ? (
              <YoutubePopoverButton
                onSubmit={(url) =>
                  editor.commands.setYoutubeVideo({ src: url, width: 1280, height: 720 })
                }
                fullscreen={fullscreen}
              />
            ) : null}
            {normalizedAllowedNodes.includes("table") ? (
              <ToolbarToggle pressed={activeState.isTable} onPressedChange={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label="Insert table" fullscreen={fullscreen}>
                <Table2 className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("horizontalRule") ? (
              <ToolbarButton type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().setHorizontalRule().run()} fullscreen={fullscreen}>
                <Minus className="size-4" />
              </ToolbarButton>
            ) : null}
            {normalizedAllowedNodes.includes("hardBreak") ? (
              <ToolbarButton type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().setHardBreak().run()} fullscreen={fullscreen}>
                <Pilcrow className="size-4" />
              </ToolbarButton>
            ) : null}
          </ToolbarGroup>
        )
      : null,
    hasAny(normalizedAllowedNodes, ["blockquote", "superscript", "subscript", "codeBlock"])
      ? (
          <ToolbarGroup key="blocks" fullscreen={fullscreen}>
            {normalizedAllowedNodes.includes("blockquote") ? (
              <ToolbarToggle pressed={activeState.isBlockquote} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} label="Blockquote" fullscreen={fullscreen}>
                <Quote className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("superscript") ? (
              <ToolbarToggle pressed={activeState.isSuperscript} onPressedChange={() => editor.chain().focus().toggleSuperscript().run()} label="Superscript" fullscreen={fullscreen}>
                <SuperscriptIcon className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("subscript") ? (
              <ToolbarToggle pressed={activeState.isSubscript} onPressedChange={() => editor.chain().focus().toggleSubscript().run()} label="Subscript" fullscreen={fullscreen}>
                <SubscriptIcon className="size-4" />
              </ToolbarToggle>
            ) : null}
            {normalizedAllowedNodes.includes("codeBlock") ? (
              <ToolbarToggle pressed={activeState.isCodeBlock} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} label="Code block" fullscreen={fullscreen}>
                <Code2 className="size-4" />
              </ToolbarToggle>
            ) : null}
          </ToolbarGroup>
        )
      : null,
  ].filter(Boolean)

  return (
    <div className={cn("border-b border-border/70 bg-muted/35", fullscreen ? "sticky top-0 z-10 px-3 py-3 backdrop-blur md:px-6" : "px-3 py-3")}>
      <div className={cn("flex flex-wrap items-center", fullscreen ? "gap-2.5 md:gap-3" : "gap-2")}>
        {groups.map((group, index) => (
          <div key={index} className="flex items-center gap-2">
            {group}
            {index < groups.length - 1 ? <ToolbarDivider /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SelectionBubbleMenu({
  editor,
  activeState,
  normalizedAllowedNodes,
  onOpenLinkDialog,
  disabled = false,
}: {
  editor: Editor
  activeState: ActiveState
  normalizedAllowedNodes: RichTextAllowedNode[]
  onOpenLinkDialog: () => void
  disabled?: boolean
}) {
  if (
    !hasAny(normalizedAllowedNodes, ["bold", "italic", "underline", "link", "textColor"]) &&
    !normalizedAllowedNodes.includes("image")
  ) {
    return null
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      shouldShow={({ editor: currentEditor }: { editor: Editor }) =>
        !disabled &&
        (currentEditor.isActive("image") || !currentEditor.state.selection.empty)
      }
      className="rounded-xl border border-border/70 bg-popover/95 p-1.5 shadow-xl backdrop-blur"
    >
      {editor.isActive("image") ? (
        <div className="flex items-center gap-1">
          <ToolbarToggle
            pressed={activeState.currentImageAlign === "left"}
            onPressedChange={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}
            label="Align image left"
          >
            <AlignLeft className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={activeState.currentImageAlign === "center"}
            onPressedChange={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}
            label="Align image center"
          >
            <AlignCenter className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={activeState.currentImageAlign === "right"}
            onPressedChange={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}
            label="Align image right"
          >
            <AlignRight className="size-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={activeState.currentImageAlign === "full"}
            onPressedChange={() =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", {
                  align: "full",
                  width: null,
                  height: null,
                })
                .run()
            }
            label="Make image full width"
          >
            <Expand className="size-4" />
          </ToolbarToggle>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {normalizedAllowedNodes.includes("bold") ? (
            <ToolbarToggle pressed={activeState.isBold} onPressedChange={() => editor.chain().focus().toggleBold().run()} label="Bold">
              <BoldIcon className="size-4" />
            </ToolbarToggle>
          ) : null}
          {normalizedAllowedNodes.includes("italic") ? (
            <ToolbarToggle pressed={activeState.isItalic} onPressedChange={() => editor.chain().focus().toggleItalic().run()} label="Italic">
              <ItalicIcon className="size-4" />
            </ToolbarToggle>
          ) : null}
          {normalizedAllowedNodes.includes("underline") ? (
            <ToolbarToggle pressed={activeState.isUnderline} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} label="Underline">
              <UnderlineIcon className="size-4" />
            </ToolbarToggle>
          ) : null}
          {normalizedAllowedNodes.includes("link") ? (
            <ToolbarToggle pressed={activeState.isLink} onPressedChange={onOpenLinkDialog} label="Link">
              <LinkIcon className="size-4" />
            </ToolbarToggle>
          ) : null}
          {normalizedAllowedNodes.includes("textColor") ? (
            <ColorPopoverButton type="text" color={activeState.currentTextColor} onSelect={(color) => editor.chain().focus().setColor(color).run()} onClear={() => editor.chain().focus().unsetColor().run()} />
          ) : null}
        </div>
      )}
    </BubbleMenu>
  )
}

function ToolbarGroup({ children, fullscreen = false }: { children: React.ReactNode; fullscreen?: boolean }) {
  return (
    <div className={cn("flex items-center rounded-lg border border-border/70 bg-background/80 shadow-sm backdrop-blur", fullscreen ? "gap-1.5 px-1.5 py-1.5" : "gap-1 p-1")}>
      {children}
    </div>
  )
}

function ToolbarDivider() {
  return <div className="h-5 w-px bg-border/80" />
}

function ToolbarToggle({
  pressed,
  onPressedChange,
  label,
  children,
  fullscreen = false,
}: {
  pressed: boolean
  onPressedChange: () => void
  label: string
  children: React.ReactNode
  fullscreen?: boolean
}) {
  return (
    <Toggle
      pressed={pressed}
      variant="default"
      size={fullscreen ? "default" : "sm"}
      aria-label={label}
      className={cn("border border-transparent bg-transparent text-muted-foreground shadow-none hover:border-border/60 hover:bg-muted/80 hover:text-foreground data-[state=on]:border-primary/30 data-[state=on]:bg-primary/15 data-[state=on]:text-primary", fullscreen ? "h-9 min-w-9 px-2.5" : "")}
      onMouseDown={(event) => {
        event.preventDefault()
        onPressedChange()
      }}
    >
      {children}
    </Toggle>
  )
}

function ToolbarButton(
  props: Omit<React.ComponentProps<typeof Button>, "variant" | "size" | "className"> & {
    fullscreen?: boolean
  }
) {
  const { fullscreen = false, ...rest } = props

  return (
    <Button
      {...rest}
      variant="ghost"
      size={fullscreen ? "default" : "sm"}
      className={cn("rounded-[min(var(--radius-md),12px)] border border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/80 hover:text-foreground", fullscreen ? "h-9 min-w-9 px-2.5" : "h-7 min-w-7 px-1.5")}
    />
  )
}

function ColorPopoverButton({
  type,
  color,
  onSelect,
  onClear,
  fullscreen = false,
}: {
  type: "text" | "highlight"
  color: string
  onSelect: (color: string) => void
  onClear: () => void
  fullscreen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [hexValue, setHexValue] = useState(color)
  const palette = type === "text" ? TEXT_COLOR_PRESETS : HIGHLIGHT_PRESETS

  useEffect(() => {
    setHexValue(color)
  }, [color])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={fullscreen ? "default" : "sm"}
          className={cn("rounded-[min(var(--radius-md),12px)] border border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/80 hover:text-foreground", fullscreen ? "h-9 min-w-9 px-2.5" : "h-7 min-w-7 px-1.5")}
        >
          <span className="relative flex items-center justify-center">
            {type === "text" ? <Type className="size-4" /> : <Paintbrush className="size-4" />}
            <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full" style={{ backgroundColor: color || (type === "text" ? "#94A3B8" : "#FDE68A") }} />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {palette.map((preset) => (
              <button
                key={preset}
                type="button"
                className={cn("h-8 rounded-md border transition-transform hover:scale-105", color === preset ? "border-primary ring-2 ring-primary/20" : "border-border")}
                style={{ backgroundColor: preset }}
                onClick={() => {
                  onSelect(preset)
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Input value={hexValue} onChange={(event) => setHexValue(event.target.value)} placeholder="#2563EB" />
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { onClear(); setOpen(false) }}>
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => { if (!hexValue.trim()) onClear(); else onSelect(hexValue.trim()); setOpen(false) }}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TextSizePopoverButton({
  activeSize,
  onSelect,
  fullscreen = false,
}: {
  activeSize: string
  onSelect: (size: string) => void
  fullscreen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const activeLabel =
    TEXT_SIZE_PRESETS.find((preset) => preset.value === activeSize)?.label || "Text size"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={fullscreen ? "default" : "sm"}
          className={cn("rounded-[min(var(--radius-md),12px)] border border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/80 hover:text-foreground", fullscreen ? "h-9 px-3" : "h-7 px-2")}
        >
          T
          <span className="ml-1 hidden text-xs sm:inline">{activeLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44" align="start">
        <div className="space-y-1">
          {TEXT_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted", activeSize === preset.value ? "bg-primary/10 text-primary" : "")}
              onClick={() => {
                onSelect(preset.value)
                setOpen(false)
              }}
            >
              <span>{preset.label}</span>
              <span className="text-xs text-muted-foreground">{preset.value || "Default"}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function YoutubePopoverButton({
  onSubmit,
  fullscreen = false,
}: {
  onSubmit: (url: string) => void
  fullscreen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={fullscreen ? "default" : "sm"}
          className={cn("rounded-[min(var(--radius-md),12px)] border border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/80 hover:text-foreground", fullscreen ? "h-9 min-w-9 px-2.5" : "h-7 min-w-7 px-1.5")}
        >
          <Play className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => { if (!url.trim()) return; onSubmit(url.trim()); setUrl(""); setOpen(false) }}>
              Embed
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function hasAny(nodes: RichTextAllowedNode[], candidates: RichTextAllowedNode[]) {
  return candidates.some((candidate) => nodes.includes(candidate))
}
