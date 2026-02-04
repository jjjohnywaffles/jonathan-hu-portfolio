import { useContext } from 'react';
import { WindowManagerContext } from '../context/windowManagerContextDef';
import type { WindowManagerContextType } from '../types/window';

export function useWindowManager(): WindowManagerContextType {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
}
