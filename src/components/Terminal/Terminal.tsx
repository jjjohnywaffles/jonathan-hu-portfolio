import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import { TerminalContext } from '../../context/TerminalContext';
import { TerminalHeader } from './TerminalHeader';
import { TerminalInput } from './TerminalInput';
import { TerminalOutput } from './TerminalOutput';
import { BootSequence } from './BootSequence';
import { WelcomeAnimation } from './WelcomeAnimation';
import { WelcomeMessage } from './WelcomeMessage';

type TerminalPhase = 'booting' | 'welcome-animation' | 'ready';

export const Terminal = () => {
  const [phase, setPhase] = useState<TerminalPhase>('booting');
  const { entries, currentInput, setCurrentInput, processCommand, navigateHistory } = useTerminal();
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
    if (phase !== 'booting') return;

    const handleKeyPress = () => setPhase('welcome-animation');

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [entries, phase]);

  // Boot phase
  if (phase === 'booting') {
    return (
      <div className="terminal" ref={terminalRef}>
        <TerminalHeader title="jonathan@portfolio ~ boot" />
        <div className="terminal-body boot-body">
          <BootSequence onComplete={handleBootComplete} />
        </div>
      </div>
    );
  }

  // Welcome animation phase
  if (phase === 'welcome-animation') {
    return (
      <TerminalContext.Provider value={contextValue}>
        <div className="terminal" ref={terminalRef}>
          <TerminalHeader title="jonathan@portfolio ~ zsh" />
          <div className="terminal-body" ref={outputRef}>
            <div className="terminal-content">
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
      <div className="terminal" ref={terminalRef}>
        <TerminalHeader title="jonathan@portfolio ~ zsh" />
        <div className="terminal-body" ref={outputRef}>
          <div className="terminal-content">
            <WelcomeMessage />
            {entries.map((entry) => (
              <TerminalOutput
                key={entry.id}
                id={entry.id}
                command={entry.command}
                output={entry.output}
              />
            ))}
            <TerminalInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={processCommand}
              onNavigateHistory={navigateHistory}
            />
          </div>
        </div>
      </div>
    </TerminalContext.Provider>
  );
};
