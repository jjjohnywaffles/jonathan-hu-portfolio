import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { TerminalPrompt } from './TerminalPrompt';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onNavigateHistory: (direction: 'up' | 'down') => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onNavigateHistory,
  onClear,
  disabled = false,
}: TerminalInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and when clicking anywhere in terminal
  useEffect(() => {
    if (disabled) return;

    const handleMouseUp = () => {
      // Use setTimeout to let the browser finalize selection first
      setTimeout(() => {
        // Don't focus if user has selected text (preserve selection)
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          return;
        }
        inputRef.current?.focus();
      }, 0);
    };

    document.addEventListener('mouseup', handleMouseUp);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Ctrl+C to clear console
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      onChange('');
      onClear?.();
      return;
    }

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
