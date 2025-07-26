"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Blockquote from '@tiptap/extension-blockquote';
import TiptapCode from '@tiptap/extension-code';
import TiptapCodeBlock from '@tiptap/extension-code-block';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
// Dropdown menu imports removed - we're keeping it simple with just basic formatting
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List, 
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: any; // Can be JSON object or HTML string
  onChange: (json: any) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing...",
  className,
  error = false 
}: RichTextEditorProps) {
  const [, forceUpdate] = useState({});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we want to configure manually
        paragraph: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      // Configure extensions with Tailwind classes
      Paragraph.configure({
        HTMLAttributes: {
          class: 'mb-3 leading-relaxed',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-border pl-4 my-4 italic text-muted-foreground',
        },
      }),
      TiptapCode.configure({
        HTMLAttributes: {
          class: 'bg-muted px-1 py-0.5 rounded text-sm font-mono',
        },
      }),
      TiptapCodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-muted p-4 rounded-lg overflow-x-auto my-4',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'pl-6 my-3 list-disc list-inside',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'pl-6 my-3 list-decimal list-inside',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-1 ml-0',
        },
      }),
    ],
    content: value || '',
    immediatelyRender: false, // Fix SSR hydration issues
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
    },
    onSelectionUpdate: ({ editor }) => {
      // Force re-render when selection changes to update toolbar button states
      forceUpdate({});
    },
    onTransaction: ({ editor }) => {
      // Also update on transactions (covers more edge cases)
      forceUpdate({});
    },
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none p-4 min-h-[150px] text-foreground',
        'data-placeholder': placeholder,
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={cn(
      "border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      error && "border-destructive focus-within:ring-destructive",
      className
    )}>
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap bg-muted/30">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6" />

        {/* Quote & Code */}
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('codeBlock')}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </Toggle>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
        {/* Placeholder */}
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
} 