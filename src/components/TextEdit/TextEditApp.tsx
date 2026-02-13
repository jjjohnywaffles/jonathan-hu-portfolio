import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AppComponentProps, TextEditData } from '../../types/window';

const MARKDOWN_CLASSES = `p-4 prose prose-invert prose-sm max-w-none
  prose-headings:text-text-primary prose-headings:font-semibold
  prose-p:text-text-secondary prose-p:leading-relaxed
  prose-a:text-accent prose-a:no-underline hover:prose-a:underline
  prose-strong:text-text-primary
  prose-code:text-accent-secondary prose-code:bg-bg-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
  prose-pre:bg-bg-tertiary prose-pre:border prose-pre:border-border-primary
  prose-ul:text-text-secondary prose-ol:text-text-secondary
  prose-li:text-text-secondary
  prose-hr:border-border-primary
  prose-blockquote:border-border-primary prose-blockquote:text-text-muted
  prose-table:text-text-secondary
  prose-th:text-text-primary prose-th:border-border-primary prose-th:px-3 prose-th:py-1.5
  prose-td:border-border-primary prose-td:px-3 prose-td:py-1.5`;

export const TextEditApp = ({ data }: AppComponentProps) => {
  const typed = data as unknown as TextEditData | undefined;
  const fileName = typed?.fileName || 'Untitled';
  const fileType = typed?.fileType || 'markdown';
  const initialContent = typed?.content || '';

  const [text, setText] = useState(initialContent);
  const [mode, setMode] = useState<'edit' | 'preview'>('preview');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when switching to edit mode
  useEffect(() => {
    if (mode === 'edit') {
      textareaRef.current?.focus();
    }
  }, [mode]);

  return (
    <div className="w-full h-full bg-bg-secondary flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary border-b border-border-primary text-xs text-text-muted">
        <span className="truncate">{fileName}</span>
        <div className="flex gap-0.5 bg-bg-secondary rounded p-0.5">
          <button
            onClick={() => setMode('edit')}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === 'edit'
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === 'preview'
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {mode === 'preview' ? (
          <div
            onClick={() => setMode('edit')}
            className={
              fileType === 'markdown'
                ? `${MARKDOWN_CLASSES} cursor-text min-h-full`
                : 'p-4 cursor-text min-h-full'
            }
          >
            {fileType === 'markdown' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            ) : (
              <pre className="text-text-primary text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {text}
              </pre>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-4 bg-transparent text-text-primary text-sm font-mono leading-relaxed resize-none outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};
