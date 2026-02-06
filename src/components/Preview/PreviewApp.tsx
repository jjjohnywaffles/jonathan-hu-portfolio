import type { AppComponentProps } from '../../types/window';

export const PreviewApp = ({ data }: AppComponentProps) => {
  const url = data?.url as string;
  const fileName = (data?.fileName as string) || 'Preview';

  if (!url) {
    return (
      <div className="w-full h-full bg-bg-secondary flex items-center justify-center text-text-muted">
        No file to preview
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-secondary flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center px-3 py-1.5 bg-bg-tertiary border-b border-border-primary text-xs text-text-muted">
        <span className="truncate">{fileName}</span>
      </div>

      <iframe
        src={url}
        className="flex-1 w-full border-none"
        title={fileName}
      />
    </div>
  );
};
