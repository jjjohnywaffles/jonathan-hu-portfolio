import type { FC, ReactNode } from 'react';

// Preview component props - can be extended with window-specific data if needed
export interface MinimizedPreviewProps {
  windowId: string;
}

// Preview renderer type - function that returns JSX
type PreviewRenderer = (windowId: string) => ReactNode;

// Registry of app-specific preview renderers
const previewRegistry: Record<string, PreviewRenderer> = {};

// Get the preview component for an app, or fall back to default
export function getPreviewComponent(appId: string): FC<MinimizedPreviewProps> | null {
  const renderer = previewRegistry[appId];
  if (!renderer) return null;
  // This is kept for backwards compatibility but shouldn't be used
  return null;
}

// Render a preview for an app
export function renderPreview(appId: string, windowId: string): ReactNode {
  const renderer = previewRegistry[appId];
  if (renderer) {
    return renderer(windowId);
  }
  // Default preview
  return (
    <div className="minimized-preview default-preview">
      <div className="preview-line" />
      <div className="preview-line short" />
      <div className="preview-line medium" />
    </div>
  );
}

// Register a new preview renderer
export function registerPreview(appId: string, renderer: PreviewRenderer): void {
  previewRegistry[appId] = renderer;
}
