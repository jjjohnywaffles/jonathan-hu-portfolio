import ReactMarkdown from 'react-markdown';
import type { AppComponentProps } from '../../types/window';

export const TextEditApp = ({ data }: AppComponentProps) => {
  const fileName = (data?.fileName as string) || 'Untitled';
  const fileType = (data?.fileType as string) || 'text';
  const content = (data?.content as string) || '';

  return (
    <div className="w-full h-full bg-bg-secondary flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center px-3 py-1.5 bg-bg-tertiary border-b border-border-primary text-xs text-text-muted">
        <span className="truncate">{fileName}</span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {fileType === 'markdown' ? (
          <div className="prose prose-invert prose-sm max-w-none
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
          ">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <pre className="text-text-primary text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};
