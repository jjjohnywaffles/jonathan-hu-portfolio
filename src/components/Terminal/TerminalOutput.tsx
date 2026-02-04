import type { ReactNode } from 'react';
import { useContext } from 'react';
import { EntryContext, TerminalContext } from '../../context/TerminalContext';
import { TerminalPrompt } from './TerminalPrompt';

interface TerminalOutputProps {
  id: string;
  command?: string;
  output: ReactNode;
}

export const TerminalOutput = ({ id, command, output }: TerminalOutputProps) => {
  const { activeEntryId } = useContext(TerminalContext);

  return (
    <EntryContext.Provider value={id}>
      <TerminalContext.Provider value={{ activeEntryId, currentEntryId: id }}>
        <div className="flex flex-col gap-2">
          {command !== undefined && (
            <div className="flex items-center gap-2">
              <TerminalPrompt />
              <span className="text-text-primary">{command}</span>
            </div>
          )}
          {output && <div className="mt-2">{output}</div>}
        </div>
      </TerminalContext.Provider>
    </EntryContext.Provider>
  );
};
