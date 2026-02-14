import { useContext } from 'react';
import { AppWindow } from 'lucide-react';
import { FileSystemContext } from '../../context/fileSystemContextDef';
import { useWindowManager } from '../../hooks/useWindowManager';
import { openFile } from '../../utils/fileActions';
import type { FileNode } from '../../types/filesystem';

const DESKTOP_PATH = '/home/visitor/Desktop';

export const DesktopIcons = () => {
  const fsContext = useContext(FileSystemContext);
  const { openApp } = useWindowManager();

  if (!fsContext || fsContext.isLoading) return null;

  const desktopNode = fsContext.getNode(DESKTOP_PATH);
  if (!desktopNode || desktopNode.type !== 'folder') return null;

  const items = Object.values(desktopNode.children);
  if (items.length === 0) return null;

  const handleDoubleClick = (item: FileNode) => {
    openFile(item, openApp);
  };

  return (
    <div className="absolute top-4 right-4 z-0 flex flex-col flex-wrap-reverse items-end gap-1 max-h-[calc(100vh-100px)]">
      {items.map((item) => (
        <button
          key={item.name}
          className="flex flex-col items-center gap-1 w-20 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-default select-none"
          onDoubleClick={() => item.type === 'file' && handleDoubleClick(item as FileNode)}
        >
          <AppWindow size={40} className="text-text-muted" />
          <span className="text-[10px] text-text-primary text-center line-clamp-2 leading-tight font-mono">
            {item.name.replace('.app', '')}
          </span>
        </button>
      ))}
    </div>
  );
};
