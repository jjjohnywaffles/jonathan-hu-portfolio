import { Home, Monitor, FileText, FolderOpen, Grid2X2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { HOME_PATH } from '../../data/filesystem';

interface SidebarItem {
  name: string;
  path: string;
  icon: ReactNode;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sections: SidebarSection[] = [
  {
    title: 'Favorites',
    items: [
      { name: 'Home', path: HOME_PATH, icon: <Home size={16} /> },
      { name: 'Desktop', path: `${HOME_PATH}/Desktop`, icon: <Monitor size={16} /> },
      { name: 'Documents', path: `${HOME_PATH}/Documents`, icon: <FileText size={16} /> },
      { name: 'Projects', path: `${HOME_PATH}/Projects`, icon: <FolderOpen size={16} /> },
    ],
  },
  {
    title: 'Locations',
    items: [{ name: 'Applications', path: '/Applications', icon: <Grid2X2 size={16} /> }],
  },
];

interface SidebarButtonProps {
  item: SidebarItem;
  isActive: boolean;
  onClick: () => void;
}

const SidebarButton = ({ item, isActive, onClick }: SidebarButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
      isActive
        ? 'bg-accent/20 text-accent'
        : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
    }`}
  >
    {item.icon}
    <span className="truncate">{item.name}</span>
  </button>
);

interface FinderSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const FinderSidebar = ({ currentPath, onNavigate }: FinderSidebarProps) => {
  return (
    <div className="w-44 bg-bg-tertiary/50 border-r border-border-primary flex flex-col py-2 overflow-y-auto">
      {sections.map((section, index) => (
        <div key={section.title} className={index > 0 ? 'mt-3' : ''}>
          <div className="px-3 py-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {section.title}
            </span>
          </div>
          {section.items.map((item) => (
            <SidebarButton
              key={item.path}
              item={item}
              isActive={currentPath === item.path}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
