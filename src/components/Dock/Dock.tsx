import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '../../hooks/useWindowManager';
import { DockAppItem } from './DockItem';
import { DockMinimizedPreview } from './DockMinimizedPreview';

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
      className="fixed bottom-2 left-0 right-0 flex justify-center z-[1000] pointer-events-none"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-2 pt-2 px-3 pb-3 bg-dock-bg backdrop-blur-[20px] rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-auto">
        {/* App icons */}
        <div className="flex items-center gap-1">
          {apps.map((app) => (
            <DockAppItem key={app.id} appId={app.id} />
          ))}
        </div>

        {/* Separator and minimized windows */}
        {minimizedWindows.length > 0 && <div className="w-px h-10 bg-white/20 mx-1" />}
        {minimizedWindows.map((window) => (
          <DockMinimizedPreview key={window.id} windowConfig={window} />
        ))}
      </div>
    </motion.div>
  );
};
