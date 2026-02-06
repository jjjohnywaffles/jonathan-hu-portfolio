import { useState, useCallback } from 'react';
import { useFileSystem } from '../../hooks/useFileSystem';
import { useWindowManager } from '../../hooks/useWindowManager';
import { FinderSidebar } from './FinderSidebar';
import { FinderToolbar } from './FinderToolbar';
import { FinderBreadcrumb } from './FinderBreadcrumb';
import { FinderMainView } from './FinderMainView';
import { openFile } from '../../utils/fileActions';
import type { FSNode } from '../../types/filesystem';

export type ViewMode = 'icons' | 'list';

export const FinderApp = () => {
  const fs = useFileSystem();
  const { openApp } = useWindowManager();
  const [viewMode, setViewMode] = useState<ViewMode>('icons');
  const [history, setHistory] = useState<string[]>([fs.currentPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const navigateTo = useCallback(
    (path: string) => {
      const resolved = fs.resolvePath(path);
      const success = fs.navigate(path);
      if (success) {
        // Add to history, removing any forward history
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), resolved]);
        setHistoryIndex((prev) => prev + 1);
        setSelectedItem(null);
      }
    },
    [fs, historyIndex]
  );

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      fs.navigate(history[newIndex]);
      setSelectedItem(null);
    }
  }, [canGoBack, historyIndex, history, fs]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      fs.navigate(history[newIndex]);
      setSelectedItem(null);
    }
  }, [canGoForward, historyIndex, history, fs]);

  const handleItemClick = useCallback((item: FSNode) => {
    setSelectedItem(item.name);
  }, []);

  const handleItemDoubleClick = useCallback(
    (item: FSNode) => {
      if (item.type === 'folder') {
        navigateTo(item.name);
      } else if (item.type === 'file') {
        openFile(item, openApp);
      }
    },
    [navigateTo, openApp]
  );

  const items = fs.listDirectory() || [];

  return (
    <div className="w-full h-full bg-bg-secondary flex flex-col overflow-hidden">
      <FinderToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={goBack}
        onGoForward={goForward}
      />
      <FinderBreadcrumb currentPath={fs.currentPath} onNavigate={navigateTo} />
      <div className="flex-1 flex overflow-hidden">
        <FinderSidebar currentPath={fs.currentPath} onNavigate={navigateTo} />
        <FinderMainView
          items={items}
          viewMode={viewMode}
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleItemDoubleClick}
        />
      </div>
    </div>
  );
};
