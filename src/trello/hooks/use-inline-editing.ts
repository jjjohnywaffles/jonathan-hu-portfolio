// Reusable hook for inline editing patterns that handles edit state, keyboard shortcuts, auto-focus, and save/cancel operations
import { useState, useRef, useEffect, useCallback } from 'react';

type UseInlineEditingOptions<T> = {
  value: T;
  onSave: (newValue: T) => void;
  onCancel?: () => void;
  transform?: (value: T) => T; // Optional transformation before saving (e.g., trim for strings)
  autoFocus?: boolean;
  selectAllOnFocus?: boolean;
};

export function useInlineEditing<T>({
  value,
  onSave,
  onCancel,
  transform,
  autoFocus = true,
  selectAllOnFocus = false,
}: UseInlineEditingOptions<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Sync editing value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditingValue(value);
    }
  }, [value, isEditing]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && autoFocus && inputRef.current) {
      inputRef.current.focus();
      if (selectAllOnFocus && 'select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing, autoFocus, selectAllOnFocus]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const save = useCallback(() => {
    const finalValue = transform ? transform(editingValue) : editingValue;
    if (finalValue !== value) {
      onSave(finalValue);
    }
    setIsEditing(false);
  }, [editingValue, value, onSave, transform]);

  const cancel = useCallback(() => {
    setEditingValue(value);
    setIsEditing(false);
    onCancel?.();
  }, [value, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel]
  );

  return {
    isEditing,
    editingValue,
    inputRef,
    startEditing,
    save,
    cancel,
    setEditingValue,
    handleKeyDown,
  };
}
