import type { ReactNode } from 'react';

// Terminal preview renderer
export function renderTerminalPreview(): ReactNode {
  return (
    <div className="w-full h-full flex flex-col gap-[3px] pointer-events-none overflow-hidden justify-center">
      <div className="h-[3px] bg-accent rounded-sm opacity-60 w-full" />
      <div className="h-[3px] bg-text-muted rounded-sm opacity-40 w-1/2" />
      <div className="h-[3px] bg-text-muted rounded-sm opacity-40 w-3/4" />
    </div>
  );
}
