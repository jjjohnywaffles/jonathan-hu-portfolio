import { Home, Monitor, FileText, FolderOpen, Grid2X2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { HOME_PATH } from '../../data/filesystem';

interface SidebarItem {
  name: string;
  path: string;
  icon: ReactNode;
}

const favorites: SidebarItem[] = [
  { name: 'Home', path: HOME_PATH, icon: <Home size={16} /> },
  { name: 'Desktop', path: `${HOME_PATH}/Desktop`, icon: <Monitor size={16} /> },
  { name: 'Documents', path: `${HOME_PATH}/Documents`, icon: <FileText size={16} /> },
  { name: 'Projects', path: `${HOME_PATH}/Projects`, icon: <FolderOpen size={16} /> },
];

const locations: SidebarItem[] = [
  { name: 'Applications', path: '/Applications', icon: <Grid2X2 size={16} /> },
];

interface FinderSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const FinderSidebar = ({ currentPath, onNavigate }: FinderSidebarProps) => {
  return (
    <div className="w-44 bg-bg-tertiary/50 border-r border-border-primary flex flex-col py-2 overflow-y-auto">
      <div className="px-3 py-1">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Favorites
        </span>
      </div>
      {favorites.map((item) => (
        <button
          key={item.path}
          onClick={() => onNavigate(item.path)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
            currentPath === item.path
              ? 'bg-accent/20 text-accent'
              : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
          }`}
        >
          {item.icon}
          <span className="truncate">{item.name}</span>
        </button>
      ))}

      <div className="px-3 py-1 mt-3">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Locations
        </span>
      </div>
      {locations.map((item) => (
        <button
          key={item.path}
          onClick={() => onNavigate(item.path)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
            currentPath === item.path
              ? 'bg-accent/20 text-accent'
              : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
          }`}
        >
          {item.icon}
          <span className="truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );
};
