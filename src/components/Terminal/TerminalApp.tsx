import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import { TerminalContext } from '../../context/TerminalContext';
import { TerminalInput } from './TerminalInput';
import { TerminalOutput } from './TerminalOutput';
import { BootSequence } from './BootSequence';
import { WelcomeAnimation } from './WelcomeAnimation';
import { WelcomeMessage } from './WelcomeMessage';
import type { AppComponentProps } from '../../types/window';

type TerminalPhase = 'booting' | 'welcome-animation' | 'ready';

export const TerminalApp = ({ isFocused }: AppComponentProps) => {
  const [phase, setPhase] = useState<TerminalPhase>('booting');
  const { entries, currentInput, setCurrentInput, processCommand, navigateHistory, clearEntries } =
    useTerminal();
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Track the active (most recent) entry ID
  const activeEntryId = useMemo(() => {
    return entries.length > 0 ? entries[entries.length - 1].id : null;
  }, [entries]);

  const contextValue = useMemo(() => ({ activeEntryId, currentEntryId: null }), [activeEntryId]);

  const handleBootComplete = useCallback(() => {
    setPhase('welcome-animation');
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setPhase('ready');
  }, []);

  // Allow skipping boot sequence with any key press
  useEffect(() => {
    if (phase !== 'booting' || !isFocused) return;

    const handleKeyPress = () => setPhase('welcome-animation');

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, isFocused]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [entries, phase]);

  const terminalAppClasses = 'w-full h-full bg-bg-terminal flex flex-col overflow-hidden';
  const terminalBodyClasses = 'flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar';

  // Boot phase
  if (phase === 'booting') {
    return (
      <div className={terminalAppClasses} ref={terminalRef}>
        <div className={`${terminalBodyClasses} flex items-center justify-center`}>
          <BootSequence onComplete={handleBootComplete} />
        </div>
      </div>
    );
  }

  // Welcome animation phase
  if (phase === 'welcome-animation') {
    return (
      <TerminalContext.Provider value={contextValue}>
        <div className={terminalAppClasses} ref={terminalRef}>
          <div className={terminalBodyClasses} ref={outputRef}>
            <div className="flex flex-col gap-4">
              <WelcomeAnimation onComplete={handleWelcomeComplete} />
            </div>
          </div>
        </div>
      </TerminalContext.Provider>
    );
  }

  // Ready phase - normal terminal operation
  return (
    <TerminalContext.Provider value={contextValue}>
      <div className={terminalAppClasses} ref={terminalRef}>
        <div className={terminalBodyClasses} ref={outputRef}>
          <div className="flex flex-col gap-4">
            <WelcomeMessage />
            {entries.map((entry) => (
              <TerminalOutput
                key={entry.id}
                id={entry.id}
                command={entry.command}
                output={entry.output}
                path={entry.path}
              />
            ))}
            <TerminalInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={processCommand}
              onNavigateHistory={navigateHistory}
              onClear={clearEntries}
              containerRef={terminalRef}
            />
          </div>
        </div>
      </div>
    </TerminalContext.Provider>
  );
};
