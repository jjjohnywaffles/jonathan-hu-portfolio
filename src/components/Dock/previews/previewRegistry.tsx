import type { ReactNode } from 'react';

// Preview renderer type - function that returns JSX
type PreviewRenderer = () => ReactNode;

// Registry of app-specific preview renderers
const previewRegistry: Record<string, PreviewRenderer> = {};

// Render a preview for an app
export function renderPreview(appId: string): ReactNode {
  const renderer = previewRegistry[appId];
  if (renderer) {
    return renderer();
  }
  // Default preview
  return (
    <div className="w-full h-full flex flex-col gap-[3px] pointer-events-none overflow-hidden justify-center">
      <div className="h-[3px] bg-text-muted rounded-sm opacity-40 w-full" />
      <div className="h-[3px] bg-text-muted rounded-sm opacity-40 w-1/2" />
      <div className="h-[3px] bg-text-muted rounded-sm opacity-40 w-3/4" />
    </div>
  );
}

// Register a new preview renderer
export function registerPreview(appId: string, renderer: PreviewRenderer): void {
  previewRegistry[appId] = renderer;
}
