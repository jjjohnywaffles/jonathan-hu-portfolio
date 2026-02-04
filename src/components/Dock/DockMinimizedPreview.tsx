import { useState } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';
import { renderPreview } from './previews';
import type { WindowConfig } from '../../types/window';
import './previews/previews.css';

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
      className="dock-minimized-preview"
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && <span className="dock-preview-tooltip">{windowConfig.title}</span>}

      {/* App-specific or default preview */}
      {renderPreview(windowConfig.appId, windowConfig.id)}

      {/* App icon badge in bottom right */}
      <span className="dock-preview-badge">{app.icon}</span>
    </button>
  );
};
