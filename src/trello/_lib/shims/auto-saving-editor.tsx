import { useCallback, useEffect, useRef, useState, memo, type FC } from 'react';
import { cn } from './utils';

type AutoSavingEditorProps = {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  autoHeight?: boolean;
  className?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  maxHeight?: string;
};

export const AutoSavingEditor: FC<AutoSavingEditorProps> = memo(function AutoSavingEditor({
  value,
  onSave,
  placeholder,
  multiline = false,
  rows = 3,
  autoHeight = false,
  className,
  debounceMs = 500,
  autoFocus = false,
  maxHeight,
}) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleSave = useCallback(
    async (valueToSave: string) => {
      if (valueToSave === (value ?? '')) return;
      try {
        await onSave(valueToSave);
      } catch (error) {
        console.error('Failed to save:', error);
      }
    },
    [onSave, value]
  );

  const autoResizeTextarea = useCallback(() => {
    if (autoHeight && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [autoHeight]);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      if (autoHeight) setTimeout(autoResizeTextarea, 0);
      if (timeoutId) clearTimeout(timeoutId);
      const newTimeoutId = setTimeout(() => handleSave(newValue), debounceMs);
      setTimeoutId(newTimeoutId);
    },
    [timeoutId, handleSave, debounceMs, autoHeight, autoResizeTextarea]
  );

  useEffect(() => {
    if (autoHeight) autoResizeTextarea();
  }, [localValue, autoHeight, autoResizeTextarea]);

  useEffect(() => {
    if (!autoHeight || !textareaRef.current) return;
    const resizeObserver = new ResizeObserver(() => setTimeout(autoResizeTextarea, 0));
    resizeObserver.observe(textareaRef.current);
    return () => resizeObserver.disconnect();
  }, [autoHeight, autoResizeTextarea]);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const inputClassName = cn(
    '-mx-1 -my-0.5 rounded border-0 bg-transparent px-1 py-0.5 text-xs leading-tight hover:bg-gray-50 focus:bg-white focus:outline-none',
    autoHeight && 'min-h-0 resize-none overflow-hidden',
    maxHeight && 'resize-none overflow-y-auto',
    className
  );

  return (
    <div>
      {multiline ? (
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={autoHeight ? 1 : rows}
          className={inputClassName}
          style={maxHeight ? { maxHeight } : undefined}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
});
