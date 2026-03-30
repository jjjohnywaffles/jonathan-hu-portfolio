import { useContext, useState, useEffect, useCallback } from 'react';
import { AppWindow } from 'lucide-react';
import { FileSystemContext } from '../../context/fileSystemContextDef';
import { useWindowManager } from '../../hooks/useWindowManager';
import { openFile } from '../../utils/fileActions';
import type { FileNode, FSNode } from '../../types/filesystem';
import { DraggableDesktopIcon } from './DraggableDesktopIcon';
import type { Position } from '../../hooks/useDraggable';

const DESKTOP_PATH = '/home/visitor/Desktop';
const ICON_SPACING = 80;
const ICON_MARGIN = 16;

function getSortedItems(desktopNode: FSNode | null): FSNode[] {
  if (!desktopNode || desktopNode.type !== 'folder') return [];
  return Object.values(desktopNode.children).sort((a, b) => {
    const aIsApp = a.name.endsWith('.app') ? 0 : 1;
    const bIsApp = b.name.endsWith('.app') ? 0 : 1;
    return aIsApp - bIsApp || a.name.localeCompare(b.name);
  });
}

function getDefaultPosition(index: number): Position {
  return {
    x: window.innerWidth - ICON_SPACING - ICON_MARGIN,
    y: ICON_MARGIN + index * ICON_SPACING,
  };
}

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

  const desktopNode = fsContext && !fsContext.isLoading ? fsContext.getNode(DESKTOP_PATH) : null;
  const items = getSortedItems(desktopNode ?? null);

  if (items.length === 0) return null;

  const handleClick = (item: FSNode, wasDragged: boolean) => {
    if (wasDragged) return;
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
    <>
      {items.map((item, i) => (
        <DraggableDesktopIcon
          key={item.name}
          name={item.name}
          icon={getIcon(item)}
          isSelected={selectedIcon === item.name}
          position={getDefaultPosition(i)}
          onClick={(wasDragged) => handleClick(item, wasDragged)}
        />
      ))}
    </>
  );
};
