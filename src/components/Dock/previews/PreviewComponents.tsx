import type { ReactNode } from 'react';

// Terminal preview renderer
export function renderTerminalPreview(_windowId: string): ReactNode {
  void _windowId; // Parameter reserved for future use
  return (
    <div className="minimized-preview terminal-preview">
      <div className="preview-line accent" />
      <div className="preview-line short" />
      <div className="preview-line medium" />
    </div>
  );
}
