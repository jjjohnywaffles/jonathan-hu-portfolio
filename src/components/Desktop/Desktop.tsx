import { useEffect, useMemo, useRef, useCallback } from 'react';
import { WindowManagerProvider } from '../../context/WindowManagerContext';
import { useWindowManager } from '../../hooks/useWindowManager';
import { Window } from '../Window';
import { Dock } from '../Dock';
import { apps } from '../../data/apps';

const DesktopContent = () => {
  const { windows, focusedWindowId, getApp, openApp } = useWindowManager();
  const hasInitialized = useRef(false);

  // Open terminal on first render
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      openApp('terminal');
    }
  }, [openApp]);

  // Calculate dock item positions for minimize animation
  const getDockPosition = useCallback(() => {
    // Default to center-bottom of screen
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight - 35,
    };
  }, []);

  // Check if any window is maximized
  const hasMaximizedWindow = useMemo(
    () => Object.values(windows).some((w) => w.state === 'maximized'),
    [windows]
  );

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-bg-primary z-0" />

      {/* Windows area */}
      <div
        className={`absolute top-0 left-0 w-full z-[1] ${
          hasMaximizedWindow ? 'h-full' : 'h-[calc(100%-70px)]'
        }`}
      >
        {Object.values(windows).map((windowConfig) => {
          const app = getApp(windowConfig.appId);
          if (!app) return null;

          const AppComponent = app.component;

          return (
            <Window
              key={windowConfig.id}
              windowConfig={windowConfig}
              dockPosition={getDockPosition()}
            >
              <AppComponent
                windowId={windowConfig.id}
                isMaximized={windowConfig.state === 'maximized'}
                isFocused={focusedWindowId === windowConfig.id}
              />
            </Window>
          );
        })}
      </div>

      <Dock />
    </div>
  );
};

export const Desktop = () => {
  return (
    <WindowManagerProvider apps={apps}>
      <DesktopContent />
    </WindowManagerProvider>
  );
};
