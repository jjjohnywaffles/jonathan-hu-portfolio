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
        <div className="terminal-output">
          {command !== undefined && (
            <div className="terminal-command-line">
              <TerminalPrompt />
              <span className="terminal-command-text">{command}</span>
            </div>
          )}
          {output && <div className="terminal-output-content">{output}</div>}
        </div>
      </TerminalContext.Provider>
    </EntryContext.Provider>
  );
};
