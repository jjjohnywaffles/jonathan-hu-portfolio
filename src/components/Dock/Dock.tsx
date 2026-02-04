import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '../../hooks/useWindowManager';
import { DockAppItem } from './DockItem';
import { DockMinimizedPreview } from './DockMinimizedPreview';
import './Dock.css';

export const Dock = () => {
  const { apps, windows } = useWindowManager();

  // Check if any window is maximized
  const hasMaximizedWindow = useMemo(
    () => Object.values(windows).some((w) => w.state === 'maximized'),
    [windows]
  );

  // Get minimized windows sorted by minimizedAt timestamp
  const minimizedWindows = useMemo(
    () =>
      Object.values(windows)
        .filter((w) => w.state === 'minimized')
        .sort((a, b) => (a.minimizedAt || 0) - (b.minimizedAt || 0)),
    [windows]
  );

  // Don't render dock when a window is maximized
  if (hasMaximizedWindow) {
    return null;
  }

  return (
    <motion.div
      className="dock"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="dock-container">
        {/* App icons */}
        <div className="dock-apps">
          {apps.map((app) => (
            <DockAppItem key={app.id} appId={app.id} />
          ))}
        </div>

        {/* Separator and minimized windows */}
        {minimizedWindows.length > 0 && <div className="dock-separator" />}
        {minimizedWindows.map((window) => (
          <DockMinimizedPreview key={window.id} windowConfig={window} />
        ))}
      </div>
    </motion.div>
  );
};
