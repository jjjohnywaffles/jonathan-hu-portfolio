import { useState } from 'react';
import type { ReactNode } from 'react';
import { useWindowManager } from '../../hooks/useWindowManager';
import { Tooltip } from './Tooltip';

interface DockItemProps {
  icon: ReactNode;
  name: string;
  isRunning: boolean;
  onClick: () => void;
}

export const DockItem = ({ icon, name, isRunning, onClick }: DockItemProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <button
        className="w-12 h-12 flex items-center justify-center relative bg-transparent border border-accent cursor-pointer p-0 rounded-[10px] transition-colors duration-200 hover:bg-white/10"
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Tooltip text={name} visible={showTooltip} />
        <span className="text-2xl leading-none font-mono text-text-primary flex items-center justify-center">
          {icon}
        </span>
      </button>
      <span className={`mt-1 w-1 h-1 rounded-full ${isRunning ? 'bg-accent' : 'bg-transparent'}`} />
    </div>
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

  return (
    <div data-dock-app-id={appId}>
      <DockItem icon={app.icon} name={app.name} isRunning={isRunning} onClick={handleClick} />
    </div>
  );
};
