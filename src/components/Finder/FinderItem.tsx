import { Folder, FileText, FileCode, Image, File, AppWindow } from 'lucide-react';
import type { FSNode, FileType } from '../../types/filesystem';
import type { ViewMode } from './FinderApp';

interface FinderItemProps {
  item: FSNode;
  viewMode: ViewMode;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

function getFileIcon(fileType: FileType, size: number) {
  switch (fileType) {
    case 'markdown':
    case 'text':
      return <FileText size={size} />;
    case 'pdf':
      return <FileCode size={size} />;
    case 'image':
      return <Image size={size} />;
    case 'executable':
      return <AppWindow size={size} />;
    default:
      return <File size={size} />;
  }
}

function getKindLabel(item: FSNode): string {
  if (item.type === 'folder') {
    return 'Folder';
  }

  switch (item.fileType) {
    case 'markdown':
      return 'Markdown';
    case 'text':
      return 'Text';
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'Image';
    case 'executable':
      return 'Application';
    case 'link':
      return 'Link';
    default:
      return 'File';
  }
}

export const FinderItem = ({
  item,
  viewMode,
  isSelected,
  onClick,
  onDoubleClick,
}: FinderItemProps) => {
  if (viewMode === 'icons') {
    return (
      <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
          isSelected ? 'bg-accent/20' : 'hover:bg-bg-hover'
        }`}
      >
        <div className={`${item.type === 'folder' ? 'text-accent-secondary' : 'text-text-muted'}`}>
          {item.type === 'folder' ? <Folder size={40} /> : getFileIcon(item.fileType, 40)}
        </div>
        <span
          className={`text-xs text-center line-clamp-2 ${
            isSelected ? 'text-accent' : 'text-text-primary'
          }`}
        >
          {item.name.includes(' ') ? (
            item.name
          ) : (
            <span className="whitespace-nowrap">{item.name}</span>
          )}
        </span>
      </button>
    );
  }

  // List view - renders as a table row
  return (
    <tr
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-accent/20' : 'hover:bg-bg-hover'
      }`}
    >
      <td className="px-4 py-1.5">
        <div className="flex items-center gap-2">
          <div
            className={`${item.type === 'folder' ? 'text-accent-secondary' : 'text-text-muted'}`}
          >
            {item.type === 'folder' ? <Folder size={16} /> : getFileIcon(item.fileType, 16)}
          </div>
          <span className={`text-sm ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
            {item.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-1.5 text-sm text-text-muted">{getKindLabel(item)}</td>
    </tr>
  );
};
