import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { TerminalPrompt } from './TerminalPrompt';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onNavigateHistory: (direction: 'up' | 'down') => void;
  disabled?: boolean;
}

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onNavigateHistory,
  disabled = false,
}: TerminalInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and when clicking anywhere in terminal
  useEffect(() => {
    if (disabled) return;

    const handleClick = () => {
      inputRef.current?.focus();
    };

    document.addEventListener('click', handleClick);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(value);
      onChange('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigateHistory('down');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(e.target.value);
  };

  return (
    <div className="terminal-input-line">
      <TerminalPrompt />
      <div className="terminal-input-wrapper">
        <span className="terminal-input-display">{value}</span>
        {!disabled && <span className="terminal-cursor" />}
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus={!disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
