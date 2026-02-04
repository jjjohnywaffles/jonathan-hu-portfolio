import type { AppDefinition } from '../types/window';
import { TerminalApp } from '../components/Terminal/TerminalApp';

export const apps: AppDefinition[] = [
  {
    id: 'terminal',
    name: 'jonathan@portfolio — zsh',
    icon: '>_',
    component: TerminalApp,
    defaultSize: {
      width: 1000,
      height: 700,
    },
  },
];
