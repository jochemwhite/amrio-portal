"use client"

import { Extension } from "@tiptap/core"

export const TEXT_SIZE_PRESETS = [
  { label: "Small", value: "0.875rem" },
  { label: "Normal", value: "" },
  { label: "Large", value: "1.125rem" },
  { label: "Huge", value: "1.5rem" },
] as const

export const RichTextTextSize = Extension.create({
  name: "richTextTextSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
})
