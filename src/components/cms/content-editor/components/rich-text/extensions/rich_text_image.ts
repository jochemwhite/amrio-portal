"use client"

import { mergeAttributes, ResizableNodeView } from "@tiptap/core"
import Image from "@tiptap/extension-image"

type ImageAlign = "left" | "center" | "right" | "full"

export const RichTextImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-width") || element.getAttribute("width")
          return width ? Number(width) : null
        },
        renderHTML: (attributes) =>
          attributes.width ? { "data-width": String(attributes.width) } : {},
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align || "center" }),
      },
      caption: {
        default: "",
        parseHTML: (element) => {
          const figure = element.closest("figure[data-type='rich-image']") ?? element
          return figure.querySelector("figcaption")?.textContent || ""
        },
        renderHTML: () => ({}),
      },
      showCaption: {
        default: false,
        parseHTML: (element) => {
          const figure = element.closest("figure[data-type='rich-image']") ?? element
          return figure.getAttribute("data-show-caption") === "true"
        },
        renderHTML: (attributes) => ({
          "data-show-caption": String(Boolean(attributes.showCaption)),
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-type='rich-image']",
        getAttrs: (element) => {
          const figure = element as HTMLElement
          const image = figure.querySelector("img")

          return {
            src: image?.getAttribute("src") || "",
            alt: image?.getAttribute("alt") || "",
            title: image?.getAttribute("title") || "",
            width: image?.getAttribute("data-width")
              ? Number(image.getAttribute("data-width"))
              : null,
            align: image?.getAttribute("data-align") || "center",
            caption: figure.querySelector("figcaption")?.textContent || "",
            showCaption: figure.getAttribute("data-show-caption") === "true",
          }
        },
      },
      {
        tag: "img[src]",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, showCaption, width, align, ...imgAttributes } = HTMLAttributes

    return [
      "figure",
      {
        "data-type": "rich-image",
        "data-show-caption": String(Boolean(showCaption)),
        class: buildFigureClass((align || "center") as ImageAlign),
      },
      [
        "img",
        mergeAttributes(this.options.HTMLAttributes, imgAttributes, {
          "data-width": width ? String(width) : undefined,
          "data-align": align || "center",
          width: width ? String(width) : undefined,
          style: buildImageStyle({
            width: normalizeImageDimension(width),
            height: normalizeImageDimension(HTMLAttributes.height),
            align: (align || "center") as ImageAlign,
          }),
        }),
      ],
      ...(showCaption && caption
        ? [["figcaption", { class: "rich-editor-image-caption" }, caption]]
        : []),
    ]
  },

  addNodeView() {
    if (!this.options.resize || !this.options.resize.enabled || typeof document === "undefined") {
      return null
    }

    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = this.options.resize

    return ({ node, getPos, HTMLAttributes, editor }) => {
      let currentNode = node
      const image = document.createElement("img")
      let resizeContainer: HTMLElement | null = null
      let resizeWrapper: HTMLElement | null = null

      image.draggable = false
      image.decoding = "async"

      const applyImageAttributes = (attrs: Record<string, unknown>) => {
        const width = normalizeImageDimension(attrs.width)
        const height = normalizeImageDimension(attrs.height)
        const align = (attrs.align || "center") as ImageAlign

        image.src = String(attrs.src || "")
        image.alt = String(attrs.alt || "")
        image.title = String(attrs.title || "")
        image.setAttribute("data-align", align)

        if (width) {
          image.setAttribute("width", String(width))
          image.setAttribute("data-width", String(width))
        } else {
          image.removeAttribute("width")
          image.removeAttribute("data-width")
        }

        image.style.cssText = buildImageStyle({
          width,
          height,
          align,
        })

        if (resizeContainer && resizeWrapper) {
          applyResizeContainerLayout({
            container: resizeContainer,
            wrapper: resizeWrapper,
            width,
            align,
          })
        }
      }

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value == null || key === "width" || key === "height" || key === "style") {
          return
        }

        image.setAttribute(key, String(value))
      })

      applyImageAttributes(node.attrs)

      const nodeView = new ResizableNodeView({
        element: image,
        editor,
        node: currentNode,
        getPos,
        onResize: (width, height) => {
          const align = (currentNode.attrs.align || "center") as ImageAlign

          image.style.cssText = buildImageStyle({ width, height, align })

          if (resizeContainer && resizeWrapper) {
            applyResizeContainerLayout({
              container: resizeContainer,
              wrapper: resizeWrapper,
              width,
              align,
            })
          }
        },
        onCommit: (width, height) => {
          const pos = getPos()

          if (pos === undefined) {
            return
          }

          this.editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes(this.name, { width, height })
            .run()
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== currentNode.type) {
            return false
          }

          currentNode = updatedNode
          applyImageAttributes(updatedNode.attrs)
          return true
        },
        options: {
          directions,
          min: {
            width: minWidth,
            height: minHeight,
          },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
        },
      })

      const dom = nodeView.dom as HTMLElement
      resizeContainer = dom
      resizeWrapper = dom.querySelector("[data-resize-wrapper]") as HTMLElement | null

      if (resizeContainer && resizeWrapper) {
        applyResizeContainerLayout({
          container: resizeContainer,
          wrapper: resizeWrapper,
          width: normalizeImageDimension(node.attrs.width),
          align: (node.attrs.align || "center") as ImageAlign,
        })
      }

      dom.style.visibility = "hidden"
      dom.style.pointerEvents = "none"

      image.onload = () => {
        dom.style.visibility = ""
        dom.style.pointerEvents = ""
      }

      return nodeView
    }
  },
})

function buildFigureClass(align: ImageAlign) {
  if (align === "left") return "rich-editor-image my-6 mr-6"
  if (align === "right") return "rich-editor-image my-6 ml-6"
  return "rich-editor-image my-6"
}

function applyResizeContainerLayout({
  container,
  wrapper,
  width,
  align,
}: {
  container: HTMLElement
  wrapper: HTMLElement
  width: number | null
  align: ImageAlign
}) {
  container.style.display = "block"
  container.style.width = "100%"
  container.style.maxWidth = "100%"
  container.style.marginLeft = "0"
  container.style.marginRight = "0"

  wrapper.style.display = "block"
  wrapper.style.maxWidth = "100%"
  wrapper.style.width = align === "full" ? "100%" : width ? `${width}px` : "fit-content"
  wrapper.style.marginLeft = align === "center" || align === "right" ? "auto" : "0"
  wrapper.style.marginRight = align === "center" || align === "left" ? "auto" : "0"
}

function buildImageStyle({
  width,
  height,
  align,
}: {
  width: number | null
  height: number | null
  align: ImageAlign
}) {
  const baseWidth = align === "full" ? "100%" : width ? `${width}px` : undefined

  return [
    baseWidth ? `width: ${baseWidth}` : "",
    "max-width: 100%",
    align === "full" ? "height: auto" : height ? `height: ${height}px` : "height: auto",
    "border-radius: 0.75rem",
    "display: block",
    align === "full" ? "width: 100%;" : "",
  ]
    .filter(Boolean)
    .join("; ")
}

function normalizeImageDimension(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}
