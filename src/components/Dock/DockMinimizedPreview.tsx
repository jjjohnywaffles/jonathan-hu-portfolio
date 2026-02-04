import { useState } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';
import { renderPreview } from './previews';
import type { WindowConfig } from '../../types/window';

interface DockMinimizedPreviewProps {
  windowConfig: WindowConfig;
}

export const DockMinimizedPreview = ({ windowConfig }: DockMinimizedPreviewProps) => {
  const { restoreWindow, getApp } = useWindowManager();
  const [showTooltip, setShowTooltip] = useState(false);
  const app = getApp(windowConfig.appId);

  if (!app) return null;

  const handleClick = () => {
    restoreWindow(windowConfig.id);
  };

  return (
    <button
      className="w-12 h-12 flex items-center justify-center relative bg-bg-terminal border border-white/15 cursor-pointer p-1.5 rounded-[10px] overflow-hidden transition-colors duration-200 hover:bg-white/10"
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-1.5 px-3 bg-[rgba(30,30,30,0.95)] text-text-primary text-xs font-mono whitespace-nowrap rounded-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] pointer-events-none z-10 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[rgba(30,30,30,0.95)]">
          {windowConfig.title}
        </span>
      )}

      {/* App-specific or default preview */}
      {renderPreview(windowConfig.appId, windowConfig.id)}

      {/* App icon badge in bottom right */}
      <span className="absolute bottom-0.5 right-0.5 text-[10px] leading-none font-mono text-text-primary bg-black/85 py-0.5 px-[3px] rounded-[3px]">
        {app.icon}
      </span>
    </button>
  );
};
