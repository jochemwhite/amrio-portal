"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import ToolBar from "./tool-bar";

interface TiptapProps {
  initialValue?: any; // JSON object
  onChange?: (value: any) => void; // JSON object
  placeholder?: string;
  className?: string;
}

const Tiptap = ({ initialValue, onChange, placeholder = "Start typing...", className }: TiptapProps) => {
  const [value, setValue] = useState(initialValue);
  const defaultContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: null,
      },
    ],
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-4",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-4",
          },
        },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: {
            class: "text-blue-500",
          },
          isAllowedUri: (url, ctx) => {
            try {
              // construct URL
              const parsedUrl = url.includes(":") ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`);

              // use default validation
              if (!ctx.defaultValidate(parsedUrl.href)) {
                return false;
              }

              // disallowed protocols
              const disallowedProtocols = ["ftp", "file", "mailto"];
              const protocol = parsedUrl.protocol.replace(":", "");

              if (disallowedProtocols.includes(protocol)) {
                return false;
              }

              // only allow protocols specified in ctx.protocols
              const allowedProtocols = ctx.protocols.map((p) => (typeof p === "string" ? p : p.scheme));

              if (!allowedProtocols.includes(protocol)) {
                return false;
              }

              // disallowed domains
              const disallowedDomains = ["example-phishing.com", "malicious-site.net"];
              const domain = parsedUrl.hostname;

              if (disallowedDomains.includes(domain)) {
                return false;
              }

              // all checks have passed
              return true;
            } catch {
              return false;
            }
          },
          shouldAutoLink: (url) => {
            try {
              // construct URL
              const parsedUrl = url.includes(":") ? new URL(url) : new URL(`https://${url}`);

              // only auto-link if the domain is not in the disallowed list
              const disallowedDomains = ["example-no-autolink.com", "another-no-autolink.com"];
              const domain = parsedUrl.hostname;

              return !disallowedDomains.includes(domain);
            } catch {
              return false;
            }
          },
        },
      }),
    ],
    content: initialValue || defaultContent,
    editorProps: {
      attributes: {
        class: `min-h-[156px] rounded-md border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className || ""}`,
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      setValue(editor.getJSON());
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
    immediatelyRender: false, // Critical for proper SSR/client hydration
  });

  if (!editor) return null;

  return (
    <div>
      <ToolBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
