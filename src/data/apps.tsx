import { Terminal, FolderOpen, FileText, Eye, LayoutGrid } from 'lucide-react';
import type { AppDefinition } from '../types/window';
import { TerminalApp } from '../components/Terminal/TerminalApp';
import { FinderApp } from '../components/Finder';
import { TextEditApp } from '../components/TextEdit/TextEditApp';
import { PreviewApp } from '../components/Preview/PreviewApp';
import { WordleApp } from '../components/Wordle';

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
  {
    id: 'textedit',
    name: 'TextEdit',
    icon: <FileText size={24} />,
    component: TextEditApp,
    defaultSize: {
      width: 700,
      height: 550,
    },
  },
  {
    id: 'preview',
    name: 'Preview',
    icon: <Eye size={24} />,
    component: PreviewApp,
    defaultSize: {
      width: 800,
      height: 650,
    },
  },
  {
    id: 'wordle',
    name: 'Wordle',
    icon: <LayoutGrid size={24} />,
    component: WordleApp,
    defaultSize: {
      width: 500,
      height: 650,
    },
  },
];
