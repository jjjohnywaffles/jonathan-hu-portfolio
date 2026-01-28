import { useState, useCallback, type ReactNode } from 'react';
import { executeCommand } from '../components/Commands/commandUtils';

export interface TerminalEntry {
  id: string;
  command?: string;
  output: ReactNode;
}

export const useTerminal = () => {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');

  const processCommand = useCallback((input: string) => {
    const trimmed = input.trim().toLowerCase();

    // Add to command history if not empty
    if (trimmed) {
      setCommandHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
    }

    // Handle clear command specially
    if (trimmed === 'clear') {
      setEntries([]);
      return;
    }

    // Execute command and add output
    const output = executeCommand(input);
    const newEntry: TerminalEntry = {
      id: `cmd-${Date.now()}`,
      command: input,
      output,
    };

    setEntries((prev) => [...prev, newEntry]);
  }, []);

  const navigateHistory = useCallback(
    (direction: 'up' | 'down') => {
      if (commandHistory.length === 0) return;

      if (direction === 'up') {
        const newIndex =
          historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      } else {
        if (historyIndex === -1) return;
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    },
    [commandHistory, historyIndex]
  );

  return {
    entries,
    currentInput,
    setCurrentInput,
    processCommand,
    navigateHistory,
    commandHistory,
  };
};
