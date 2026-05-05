import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Policy } from '@/services/api/types';
import { policiesService } from '@/services/api/policies';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';

function buildFallbackContent(policy: Policy) {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: policy.name }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: policy.description || 'Describe the purpose and intent of this policy.' }],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '1. Purpose' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'State why this policy exists and what it protects.' }],
      },
    ],
  };
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm transition-colors ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
}

export function PolicyEditor({
  open,
  policy,
  onClose,
  onSaved,
}: {
  open: boolean;
  policy: Policy;
  onClose: () => void;
  onSaved: (policy: Policy) => void;
}) {
  const [saving, setSaving] = useState(false);
  const initialContent = policy.content || buildFallbackContent(policy);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Typography,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'min-h-[420px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (open && editor) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent, open]);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const result = await policiesService.savePolicyContent(policy.id, editor.getJSON());
      if (result.data) {
        onSaved(result.data);
        toast.success('Policy content saved');
      }
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save policy content';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>Edit Policy</SheetTitle>
          <SheetDescription>
            Update the policy body and regenerate the preview PDF.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <ToolbarButton active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
              H1
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
              H2
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()}>
              <Code className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              active={editor?.isActive('link')}
              onClick={() => {
                const previous = editor?.getAttributes('link').href as string | undefined;
                const next = window.prompt('URL', previous ?? 'https://');
                if (next === null) return;
                if (next === '') {
                  editor?.chain().focus().extendMarkRange('link').unsetLink().run();
                } else {
                  editor?.chain().focus().extendMarkRange('link').setLink({ href: next }).run();
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
              <Minus className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              <TableIcon className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3">
            <EditorContent editor={editor} />
          </div>
        </div>

        <SheetFooter className="border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!editor || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
