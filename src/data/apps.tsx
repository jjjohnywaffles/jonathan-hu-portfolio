import { Terminal, FolderOpen } from 'lucide-react';
import type { AppDefinition } from '../types/window';
import { TerminalApp } from '../components/Terminal/TerminalApp';
import { FinderApp } from '../components/Finder';

export const apps: AppDefinition[] = [
  {
    id: 'terminal',
    name: 'jonathan@portfolio — zsh',
    icon: <Terminal size={24} />,
    component: TerminalApp,
    defaultSize: {
      width: 1000,
      height: 700,
    },
  },
  {
    id: 'finder',
    name: 'Finder',
    icon: <FolderOpen size={24} />,
    component: FinderApp,
    defaultSize: {
      width: 900,
      height: 600,
    },
  },
];
