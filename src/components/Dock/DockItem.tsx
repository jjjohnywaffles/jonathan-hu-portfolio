import { useState } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';

interface DockItemProps {
  icon: string;
  name: string;
  isRunning: boolean;
  onClick: () => void;
}

export const DockItem = ({ icon, name, isRunning, onClick }: DockItemProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <button
      className="dock-item"
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && <span className="dock-item-tooltip">{name}</span>}
      <span className="dock-item-icon">{icon}</span>
      {isRunning && <span className="dock-item-indicator" />}
    </button>
  );
};

interface DockAppItemProps {
  appId: string;
}

export const DockAppItem = ({ appId }: DockAppItemProps) => {
  const { getApp, openApp, windows, focusWindow, restoreWindow } = useWindowManager();
  const app = getApp(appId);

  if (!app) return null;

  // Check if any windows of this app are open
  const appWindows = Object.values(windows).filter((w) => w.appId === appId);
  const isRunning = appWindows.length > 0;
  const hasNonMinimizedWindow = appWindows.some((w) => w.state !== 'minimized');

  const handleClick = () => {
    if (hasNonMinimizedWindow) {
      // Focus the first non-minimized window
      const windowToFocus = appWindows.find((w) => w.state !== 'minimized');
      if (windowToFocus) {
        focusWindow(windowToFocus.id);
      }
    } else if (isRunning) {
      // All windows are minimized - restore the most recent one
      const mostRecent = appWindows.reduce((a, b) =>
        (a.minimizedAt || 0) > (b.minimizedAt || 0) ? a : b
      );
      restoreWindow(mostRecent.id);
    } else {
      // No windows open - create a new one
      openApp(appId);
    }
  };

  return <DockItem icon={app.icon} name={app.name} isRunning={isRunning} onClick={handleClick} />;
};
