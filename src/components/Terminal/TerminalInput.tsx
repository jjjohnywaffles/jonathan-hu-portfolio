import { useRef, useEffect, type KeyboardEvent, type ChangeEvent, type RefObject } from 'react';
import { TerminalPrompt } from './TerminalPrompt';
import { getTabCompletion } from '../../utils/tabCompletion';
import type { LocalFileSystem } from '../../types/filesystem';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onNavigateHistory: (direction: 'up' | 'down') => void;
  onClear?: () => void;
  disabled?: boolean;
  containerRef?: RefObject<HTMLElement | null>;
  fs: LocalFileSystem;
}

export const TerminalInput = ({
  value,
  onChange,
  onSubmit,
  onNavigateHistory,
  onClear,
  disabled = false,
  containerRef,
  fs,
}: TerminalInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and when clicking anywhere in terminal container
  useEffect(() => {
    if (disabled) return;

    const container = containerRef?.current;
    if (!container) return;

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

    container.addEventListener('mouseup', handleMouseUp);
    inputRef.current?.focus();

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [disabled, containerRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Ctrl+C to clear console
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      onChange('');
      onClear?.();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const result = getTabCompletion(value, fs);
      if (result.completed !== value) {
        onChange(result.completed);
      }
      // Could display options if result.options.length > 1
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
    <div className="flex items-center gap-2">
      <TerminalPrompt path={fs.currentPath} />
      <div className="flex-1 relative flex items-center">
        <span className="text-text-primary font-mono text-sm whitespace-pre">{value}</span>
        {!disabled && (
          <span className="inline-block w-2 h-[18px] bg-accent animate-blink align-middle ml-px" />
        )}
        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0 w-full h-full bg-transparent border-none outline-none text-text-primary font-mono text-sm caret-transparent"
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
