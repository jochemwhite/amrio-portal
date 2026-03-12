import { Editor, useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Strikethrough,
  Underline
} from "lucide-react";
import { Toggle } from "../ui/toggle";
import { useCallback, useState } from "react";
import LinkDialog from "./link-dialog";

const ToolBar = ({ editor }: { editor: Editor | null }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [previousUrl, setPreviousUrl] = useState("");

  if (!editor) return null;

  // Use useEditorState to get real-time editor state updates
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        isStrike: ctx.editor.isActive("strike"),
        isCode: ctx.editor.isActive("code"),
        isBulletList: ctx.editor.isActive("bulletList"),
        isOrderedList: ctx.editor.isActive("orderedList"),
        isUnderline: ctx.editor.isActive("underline"),
        isLink: ctx.editor.isActive("link"),
      };
    },
  });

  const openLinkDialog = useCallback(() => {
    const currentUrl = editor.getAttributes('link').href || "";
    setPreviousUrl(currentUrl);
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback((url: string | null) => {
    // cancelled
    if (url === null) {
      return;
    }

    // empty - remove link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update/create link
    try {
      // If there's already a link, extend the range first, otherwise just set it
      if (editor.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
    } catch (e: any) {
      console.error('Error setting link:', e);
      alert(e.message);
    }
  }, [editor]);

  const Options = [

    {
      icon: <Bold className="size-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      pressed: editorState.isBold,
    },
    {
      icon: <Italic className="size-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      pressed: editorState.isItalic,
    },
    {
      icon: <Underline className="size-4" />,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      pressed: editorState.isUnderline,
    },
    {
      icon: <Strikethrough className="size-4" />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      pressed: editorState.isStrike,
    },
    {
      icon: <List className="size-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      pressed: editorState.isBulletList,
    },
    {
      icon: <ListOrdered className="size-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      pressed: editorState.isOrderedList,
    },
    {
      icon: <Link className="size-4" />,
      onClick: openLinkDialog,
      pressed: editorState.isLink,
    },
  ];

  return (
    <>
      <div className="border rounded-md p-1 mb-1 space-x-2 z-50">
        {Options.map((option, index) => {
          return (
            <Toggle
              key={index}
              pressed={option.pressed}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus loss
                option.onClick();
              }}
            >
              {option.icon}
            </Toggle>
          );
        })}
      </div>
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialUrl={previousUrl}
        onSubmit={handleLinkSubmit}
      />
    </>
  );
};

export default ToolBar;
