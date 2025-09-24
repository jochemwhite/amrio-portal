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
import { useCallback } from "react";

const ToolBar = ({ editor }: { editor: Editor | null }) => {
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

  
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()

      return
    }

    // update link
    try {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } catch (e: any) {
      alert(e.message);
    }
  }, [editor])

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
      onClick: setLink,
      pressed: editorState.isLink,
    },
  ];

  return (
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
  );
};

export default ToolBar;
