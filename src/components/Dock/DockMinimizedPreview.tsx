import { useState } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';
import { renderPreview } from './previews';
import { Tooltip } from './Tooltip';
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
      <Tooltip text={windowConfig.title} visible={showTooltip} />

      {/* App-specific or default preview */}
      {renderPreview(windowConfig.appId)}

      {/* App icon badge in bottom right */}
      <span className="absolute bottom-0 right-0 leading-none font-mono text-text-primary bg-black/85 p-[2px] rounded-[2px] [&_svg]:w-2.5 [&_svg]:h-2.5">
        {app.icon}
      </span>
    </button>
  );
};
