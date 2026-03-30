import { Terminal, FolderOpen, FileText, Eye } from 'lucide-react';
import type { AppDefinition } from '../types/window';
import { TerminalApp } from '../components/Terminal/TerminalApp';
import { FinderApp } from '../components/Finder';
import { TextEditApp } from '../components/TextEdit/TextEditApp';
import { PreviewApp } from '../components/Preview/PreviewApp';
import { WordleApp } from '../components/Wordle';
import { SpeedReadApp, SpeedReadReaderApp } from '../components/SpeedRead';

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
    icon: <span className="font-bold text-lg leading-none">W</span>,
    component: WordleApp,
    pinToDock: false,
    defaultSize: {
      width: 500,
      height: 650,
    },
  },
  {
    id: 'speedread',
    name: 'SpeedRead',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    component: SpeedReadApp,
    pinToDock: false,
    defaultSize: {
      width: 550,
      height: 600,
    },
  },
  {
    id: 'speedread-reader',
    name: 'SpeedRead Reader',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    component: SpeedReadReaderApp,
    pinToDock: false,
    defaultSize: {
      width: 500,
      height: 400,
    },
  },
];
