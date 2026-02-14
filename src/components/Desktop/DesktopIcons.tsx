import { useContext, useState, useEffect, useCallback } from 'react';
import { AppWindow } from 'lucide-react';
import { FileSystemContext } from '../../context/fileSystemContextDef';
import { useWindowManager } from '../../hooks/useWindowManager';
import { openFile } from '../../utils/fileActions';
import type { FileNode, FSNode } from '../../types/filesystem';

const DESKTOP_PATH = '/home/visitor/Desktop';

export const DesktopIcons = () => {
  const fsContext = useContext(FileSystemContext);
  const { openApp, getApp } = useWindowManager();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // Deselect when clicking on the desktop background
  const handleBackgroundClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-desktop-icon]')) {
      setSelectedIcon(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleBackgroundClick);
    return () => window.removeEventListener('mousedown', handleBackgroundClick);
  }, [handleBackgroundClick]);

  if (!fsContext || fsContext.isLoading) return null;

  const desktopNode = fsContext.getNode(DESKTOP_PATH);
  if (!desktopNode || desktopNode.type !== 'folder') return null;

  const items = Object.values(desktopNode.children);
  if (items.length === 0) return null;

  const handleClick = (item: FSNode) => {
    if (item.type !== 'file') return;

    if (selectedIcon === item.name) {
      openFile(item as FileNode, openApp);
      setSelectedIcon(null);
    } else {
      setSelectedIcon(item.name);
    }
  };

  const getIcon = (item: FSNode) => {
    if (item.type === 'file' && item.fileType === 'executable' && item.content) {
      const app = getApp(item.content);
      if (app) {
        return (
          <span className="text-2xl leading-none font-mono text-text-primary flex items-center justify-center">
            {app.icon}
          </span>
        );
      }
    }
    return <AppWindow size={24} className="text-text-primary" />;
  };

  return (
    <div className="absolute top-4 right-4 z-0 flex flex-col flex-wrap-reverse items-end gap-3 max-h-[calc(100vh-100px)]">
      {items.map((item) => {
        const isSelected = selectedIcon === item.name;
        return (
          <button
            key={item.name}
            data-desktop-icon
            className="flex flex-col items-center gap-1.5 select-none cursor-pointer"
            onClick={() => handleClick(item)}
          >
            <div
              className={`w-12 h-12 flex items-center justify-center border rounded-[10px] transition-colors duration-200 ${
                isSelected
                  ? 'bg-white/20 border-accent'
                  : 'bg-transparent border-accent hover:bg-white/10'
              }`}
            >
              {getIcon(item)}
            </div>
            <span
              className={`text-[10px] text-center line-clamp-2 leading-tight font-mono px-1 rounded ${
                isSelected ? 'text-white bg-accent/50' : 'text-text-primary'
              }`}
            >
              {item.name.replace('.app', '')}
            </span>
          </button>
        );
      })}
    </div>
  );
};
