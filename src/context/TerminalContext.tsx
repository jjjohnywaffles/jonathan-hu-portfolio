import { createContext, useContext } from 'react';

interface TerminalContextValue {
  activeEntryId: string | null;
  currentEntryId: string | null;
}

export const TerminalContext = createContext<TerminalContextValue>({
  activeEntryId: null,
  currentEntryId: null,
});

export const useTerminalContext = () => {
  const context = useContext(TerminalContext);
  const isActive = context.currentEntryId === context.activeEntryId;
  return { ...context, isActive };
};

// Provider for individual entries
export const EntryContext = createContext<string | null>(null);
