"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { JSONContent } from "@tiptap/core"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import type { Editor } from "@tiptap/react"
import { Expand, X } from "lucide-react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RichTextAllowedNode } from "@/utils/schema/rich_text_nodes"
import LinkDialog from "@/components/rich-editor/link-dialog"
import { MediaImagePickerDialog } from "../media_image_picker_dialog"
import {
  buildExtensions,
  DEFAULT_ACTIVE_STATE,
  normalizeRichTextValue,
  type ActiveState,
} from "./config"
import { SelectionBubbleMenu, Toolbar } from "./toolbar"

export interface RichTextEditorProps {
  value: JSONContent | string | null | undefined
  onChange: (value: JSONContent) => void
  allowedNodes: RichTextAllowedNode[]
  placeholder?: string
  fieldName?: string
}

export function RichTextEditor({
  value,
  onChange,
  allowedNodes,
  placeholder = "Start typing...",
  fieldName = "Rich text",
}: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [currentLink, setCurrentLink] = useState("")
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false)
  const [showFullscreenEditor, setShowFullscreenEditor] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)
  const isClient = typeof document !== "undefined"

  const normalizedAllowedNodes = useMemo(
    () => Array.from(new Set(allowedNodes)),
    [allowedNodes]
  )

  const extensions = useMemo(
    () => buildExtensions(normalizedAllowedNodes, placeholder),
    [normalizedAllowedNodes, placeholder]
  )

  const contentValue = useMemo(() => normalizeRichTextValue(value), [value])

  const inlineEditor = useEditor({
    immediatelyRender: false,
    extensions,
    content: contentValue,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] bg-transparent px-5 py-4 text-sm leading-7 text-foreground outline-none selection:bg-primary/20",
      },
    },
  })

  const fullscreenEditor = useEditor({
    immediatelyRender: false,
    extensions,
    content: contentValue,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] bg-transparent px-5 py-4 text-sm leading-7 text-foreground outline-none selection:bg-primary/20",
      },
    },
  })

  const inlineEditorState = useRichTextActiveState(inlineEditor)
  const fullscreenEditorState = useRichTextActiveState(fullscreenEditor)

  useEffect(() => {
    if (!inlineEditor) return
    const currentValue = inlineEditor.getJSON()
    if (JSON.stringify(currentValue) !== JSON.stringify(contentValue)) {
      inlineEditor.commands.setContent(contentValue, { emitUpdate: false })
    }
  }, [contentValue, inlineEditor])

  useEffect(() => {
    if (!fullscreenEditor) return
    const currentValue = fullscreenEditor.getJSON()
    if (JSON.stringify(currentValue) !== JSON.stringify(contentValue)) {
      fullscreenEditor.commands.setContent(contentValue, { emitUpdate: false })
    }
  }, [contentValue, fullscreenEditor])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isFullscreenOpen) return

    const frameId = requestAnimationFrame(() => {
      queueMicrotask(() => setIsFullscreenVisible(true))
    })

    return () => cancelAnimationFrame(frameId)
  }, [isFullscreenOpen])

  function closeFullscreen() {
    setIsFullscreenVisible(false)
    closeTimeoutRef.current = window.setTimeout(() => {
      setShowFullscreenEditor(false)
      setIsFullscreenOpen(false)
      closeTimeoutRef.current = null
    }, 150)
  }

  useEffect(() => {
    if (!isFullscreenOpen) return

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        closeFullscreen()
      }
    }

    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [isFullscreenOpen])

  if (!inlineEditor || !fullscreenEditor) {
    return null
  }

  const currentEditor = isFullscreenOpen ? fullscreenEditor : inlineEditor

  function openFullscreen() {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (!inlineEditor || !fullscreenEditor) return

    const nextContent = inlineEditor.getJSON()
    const fullscreenContent = fullscreenEditor.getJSON()

    if (JSON.stringify(nextContent) !== JSON.stringify(fullscreenContent)) {
      fullscreenEditor.commands.setContent(nextContent, { emitUpdate: false })
    }

    setIsFullscreenVisible(false)
    setShowFullscreenEditor(true)
    setIsFullscreenOpen(true)
  }

  function handleLinkSubmit(url: string | null) {
    if (url === null) return
    if (url === "") {
      currentEditor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    if (currentEditor.isActive("link")) {
      currentEditor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
      return
    }
    currentEditor.chain().focus().setLink({ href: url }).run()
  }

  function handleImageSelect(image: { url: string }) {
    currentEditor.chain().focus().setImage({ src: image.url }).run()
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-[0_1px_0_rgba(255,255,255,0.03),0_14px_40px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <p className="min-w-0 truncate text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {fieldName}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-md border border-border/60 px-2.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            onClick={openFullscreen}
          >
            <Expand className="size-4" />
          </Button>
        </div>

        <Toolbar
          editor={inlineEditor}
          activeState={inlineEditorState ?? DEFAULT_ACTIVE_STATE}
          normalizedAllowedNodes={normalizedAllowedNodes}
          onOpenLinkDialog={() => {
            setCurrentLink(inlineEditor.getAttributes("link").href || "")
            setIsLinkDialogOpen(true)
          }}
          onOpenImageDialog={() => setIsImageDialogOpen(true)}
          fullscreen={false}
        />

        <EditorContent
          editor={inlineEditor}
          className={cn(
            EDITOR_SURFACE_CLASS,
            isFullscreenOpen && "pointer-events-none hidden"
          )}
        />
      </div>

      <SelectionBubbleMenu
        editor={inlineEditor}
        activeState={inlineEditorState ?? DEFAULT_ACTIVE_STATE}
        normalizedAllowedNodes={normalizedAllowedNodes}
        onOpenLinkDialog={() => {
          setCurrentLink(inlineEditor.getAttributes("link").href || "")
          setIsLinkDialogOpen(true)
        }}
        disabled={isFullscreenOpen}
      />

      {isClient && isFullscreenOpen
        ? createPortal(
            <div
              className={cn(
                "fixed inset-0 z-50 transition-opacity duration-150",
                isFullscreenVisible ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="absolute inset-0 bg-[rgba(20,20,24,0.78)] backdrop-blur-sm" onClick={closeFullscreen} />
              <div className="absolute inset-0 flex flex-col bg-background/92 text-foreground">
                <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-background/95 px-4 py-3 md:px-6">
                  <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {fieldName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" className="px-4" onClick={closeFullscreen}>
                      Done
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-9 w-9 rounded-md border border-border/60 p-0" onClick={closeFullscreen}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                <Toolbar
                  editor={fullscreenEditor}
                  activeState={fullscreenEditorState ?? DEFAULT_ACTIVE_STATE}
                  normalizedAllowedNodes={normalizedAllowedNodes}
                  onOpenLinkDialog={() => {
                    setCurrentLink(fullscreenEditor.getAttributes("link").href || "")
                    setIsLinkDialogOpen(true)
                  }}
                  onOpenImageDialog={() => setIsImageDialogOpen(true)}
                  fullscreen
                />

                {showFullscreenEditor ? (
                  <>
                    <SelectionBubbleMenu
                      editor={fullscreenEditor}
                      activeState={fullscreenEditorState ?? DEFAULT_ACTIVE_STATE}
                      normalizedAllowedNodes={normalizedAllowedNodes}
                      onOpenLinkDialog={() => {
                        setCurrentLink(fullscreenEditor.getAttributes("link").href || "")
                        setIsLinkDialogOpen(true)
                      }}
                      disabled={!isFullscreenOpen}
                    />

                    <div className="flex-1 overflow-y-auto" onClick={closeFullscreen}>
                      <div className="mx-auto flex min-h-full w-full max-w-6xl justify-center px-0 py-0 md:px-6 md:py-8">
                        <div
                          className="w-full max-w-3xl md:rounded-2xl md:border md:border-border/70 md:bg-white md:shadow-[0_24px_80px_rgba(0,0,0,0.18)] dark:md:bg-card"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EditorContent editor={fullscreenEditor} className={FULLSCREEN_EDITOR_SURFACE_CLASS} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}

      <LinkDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        initialUrl={currentLink}
        onSubmit={handleLinkSubmit}
      />

      <MediaImagePickerDialog
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onSelect={handleImageSelect}
        title="Insert Image"
        description="Choose an image to insert into this rich text field"
      />
    </>
  )
}

function useRichTextActiveState(editor: Editor | null): ActiveState | null {
  return useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const paragraphAlign = currentEditor?.getAttributes("paragraph").textAlign
      const headingAlign = currentEditor?.getAttributes("heading").textAlign
      const highlightColor = currentEditor?.getAttributes("highlight").color
      const fontSize = currentEditor?.getAttributes("textStyle").fontSize
      const color = currentEditor?.getAttributes("textStyle").color

      return {
        isBold: currentEditor?.isActive("bold") ?? false,
        isItalic: currentEditor?.isActive("italic") ?? false,
        isUnderline: currentEditor?.isActive("underline") ?? false,
        isStrike: currentEditor?.isActive("strike") ?? false,
        isSuperscript: currentEditor?.isActive("superscript") ?? false,
        isSubscript: currentEditor?.isActive("subscript") ?? false,
        isBulletList: currentEditor?.isActive("bulletList") ?? false,
        isOrderedList: currentEditor?.isActive("orderedList") ?? false,
        isBlockquote: currentEditor?.isActive("blockquote") ?? false,
        isCodeBlock: currentEditor?.isActive("codeBlock") ?? false,
        isLink: currentEditor?.isActive("link") ?? false,
        isHeading1: currentEditor?.isActive("heading", { level: 1 }) ?? false,
        isHeading2: currentEditor?.isActive("heading", { level: 2 }) ?? false,
        isHeading3: currentEditor?.isActive("heading", { level: 3 }) ?? false,
        isTable: currentEditor?.isActive("table") ?? false,
        currentImageAlign: (currentEditor?.getAttributes("image").align || "center") as ActiveState["currentImageAlign"],
        currentTextAlign:
          (paragraphAlign || headingAlign || "left") as ActiveState["currentTextAlign"],
        currentTextColor: color || "",
        currentHighlightColor: highlightColor || "",
        currentFontSize: fontSize || "",
      }
    },
  })
}

const EDITOR_SURFACE_CLASS = cn(
  "rich-text-editor bg-card",
  "[&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:outline-none",
  "[&_.ProseMirror]:text-foreground [&_.ProseMirror]:caret-primary",
  "[&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:tracking-tight",
  "[&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:tracking-tight",
  "[&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold",
  "[&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-sky-400 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/90",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
  "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-xl",
  "[&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-border/70 [&_.ProseMirror_pre]:bg-muted/65 [&_.ProseMirror_pre]:p-3",
  "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-primary/45 [&_.ProseMirror_blockquote]:bg-muted/30 [&_.ProseMirror_blockquote]:py-1 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground",
  "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5",
  "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
  "[&_.ProseMirror_hr]:my-5 [&_.ProseMirror_hr]:border-border/70",
  "[&_[data-resize-container]]:my-6 [&_[data-resize-container]]:max-w-full",
  "[&_[data-resize-wrapper]]:inline-block [&_[data-resize-wrapper]]:max-w-full [&_[data-resize-wrapper]]:rounded-xl",
  "[&_[data-resize-wrapper]]:outline [&_[data-resize-wrapper]]:outline-2 [&_[data-resize-wrapper]]:outline-transparent",
  "[&_[data-resize-container][data-resize-state='true']_[data-resize-wrapper]]:outline-primary",
  "[&_[data-resize-handle]]:z-10 [&_[data-resize-handle]]:h-3 [&_[data-resize-handle]]:w-3",
  "[&_[data-resize-handle]]:rounded-full [&_[data-resize-handle]]:border-2 [&_[data-resize-handle]]:border-background",
  "[&_[data-resize-handle]]:bg-primary [&_[data-resize-handle]]:shadow-sm",
  "[&_[data-resize-handle='top-left']]:-left-1.5 [&_[data-resize-handle='top-left']]:-top-1.5 [&_[data-resize-handle='top-left']]:cursor-nwse-resize",
  "[&_[data-resize-handle='top-right']]:-right-1.5 [&_[data-resize-handle='top-right']]:-top-1.5 [&_[data-resize-handle='top-right']]:cursor-nesw-resize",
  "[&_[data-resize-handle='bottom-left']]:-bottom-1.5 [&_[data-resize-handle='bottom-left']]:-left-1.5 [&_[data-resize-handle='bottom-left']]:cursor-nesw-resize",
  "[&_[data-resize-handle='bottom-right']]:-bottom-1.5 [&_[data-resize-handle='bottom-right']]:-right-1.5 [&_[data-resize-handle='bottom-right']]:cursor-nwse-resize",
  "[&_.ProseMirror_figure[data-type='rich-image']]:clear-both",
  "[&_.ProseMirror_figure[data-type='rich-image']_figcaption]:mt-2 [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:text-center [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:text-sm [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:italic [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:text-muted-foreground",
  "[&_.ProseMirror_iframe]:aspect-video [&_.ProseMirror_iframe]:w-full [&_.ProseMirror_iframe]:rounded-xl [&_.ProseMirror_iframe]:border [&_.ProseMirror_iframe]:border-border/70",
  "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:overflow-hidden [&_.ProseMirror_table]:rounded-lg",
  "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border/70 [&_.ProseMirror_td]:bg-background/50 [&_.ProseMirror_td]:p-2",
  "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border/70 [&_.ProseMirror_th]:bg-muted/70 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:font-semibold"
)

const FULLSCREEN_EDITOR_SURFACE_CLASS = cn(
  "rich-text-editor bg-transparent",
  "[&_.ProseMirror]:min-h-screen [&_.ProseMirror]:outline-none",
  "[&_.ProseMirror]:px-5 [&_.ProseMirror]:py-6 [&_.ProseMirror]:text-[16px] [&_.ProseMirror]:leading-7 [&_.ProseMirror]:text-foreground [&_.ProseMirror]:caret-primary",
  "md:[&_.ProseMirror]:min-h-[80vh] md:[&_.ProseMirror]:px-16 md:[&_.ProseMirror]:py-12",
  "[&_.ProseMirror_h1]:text-[2rem] [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:tracking-tight",
  "[&_.ProseMirror_h2]:text-[1.5rem] [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:tracking-tight",
  "[&_.ProseMirror_h3]:text-[1.25rem] [&_.ProseMirror_h3]:font-bold",
  "[&_.ProseMirror_a]:font-medium [&_.ProseMirror_a]:text-sky-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 dark:[&_.ProseMirror_a]:text-sky-400",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/90",
  "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
  "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:bg-slate-100 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:font-mono dark:[&_.ProseMirror_pre]:bg-muted/70",
  "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/50 [&_.ProseMirror_blockquote]:pl-5 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground",
  "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul_li]:my-2",
  "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol_li]:my-2",
  "[&_.ProseMirror_hr]:my-6 [&_.ProseMirror_hr]:border-border/70",
  "[&_[data-resize-container]]:my-6 [&_[data-resize-container]]:max-w-full",
  "[&_[data-resize-wrapper]]:inline-block [&_[data-resize-wrapper]]:max-w-full [&_[data-resize-wrapper]]:rounded-xl",
  "[&_[data-resize-wrapper]]:outline [&_[data-resize-wrapper]]:outline-2 [&_[data-resize-wrapper]]:outline-transparent",
  "[&_[data-resize-container][data-resize-state='true']_[data-resize-wrapper]]:outline-primary",
  "[&_[data-resize-handle]]:z-10 [&_[data-resize-handle]]:h-3 [&_[data-resize-handle]]:w-3",
  "[&_[data-resize-handle]]:rounded-full [&_[data-resize-handle]]:border-2 [&_[data-resize-handle]]:border-background",
  "[&_[data-resize-handle]]:bg-primary [&_[data-resize-handle]]:shadow-sm",
  "[&_[data-resize-handle='top-left']]:-left-1.5 [&_[data-resize-handle='top-left']]:-top-1.5 [&_[data-resize-handle='top-left']]:cursor-nwse-resize",
  "[&_[data-resize-handle='top-right']]:-right-1.5 [&_[data-resize-handle='top-right']]:-top-1.5 [&_[data-resize-handle='top-right']]:cursor-nesw-resize",
  "[&_[data-resize-handle='bottom-left']]:-bottom-1.5 [&_[data-resize-handle='bottom-left']]:-left-1.5 [&_[data-resize-handle='bottom-left']]:cursor-nesw-resize",
  "[&_[data-resize-handle='bottom-right']]:-bottom-1.5 [&_[data-resize-handle='bottom-right']]:-right-1.5 [&_[data-resize-handle='bottom-right']]:cursor-nwse-resize",
  "[&_.ProseMirror_figure[data-type='rich-image']]:clear-both",
  "[&_.ProseMirror_figure[data-type='rich-image']_figcaption]:mt-3 [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:text-center [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:text-sm [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:italic [&_.ProseMirror_figure[data-type='rich-image']_figcaption]:text-muted-foreground",
  "[&_.ProseMirror_iframe]:aspect-video [&_.ProseMirror_iframe]:w-full [&_.ProseMirror_iframe]:rounded-xl [&_.ProseMirror_iframe]:border [&_.ProseMirror_iframe]:border-border/70",
  "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse",
  "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border/70 [&_.ProseMirror_td]:p-2",
  "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border/70 [&_.ProseMirror_th]:bg-muted/70 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:text-left"
)
