import { createContext } from 'react';
import type { WindowManagerContextType } from '../types/window';

export const WindowManagerContext = createContext<WindowManagerContextType | null>(null);
