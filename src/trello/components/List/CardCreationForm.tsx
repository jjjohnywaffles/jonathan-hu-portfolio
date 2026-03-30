import React, { memo, useRef, useEffect } from 'react';
import type { FC } from 'react';

type CardCreationFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (title: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
  placeholder?: string;
};

const CardCreationForm: FC<CardCreationFormProps> = memo(function CardCreationForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  autoFocus = true,
  placeholder = 'Enter a title or paste a link',
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousValueRef = useRef<string>(value);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Refocus after card is added (value cleared after having content)
  useEffect(() => {
    if (previousValueRef.current && !value && textareaRef.current) {
      // Value went from non-empty to empty - card was added, refocus
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
    previousValueRef.current = value;
  }, [value]);

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      onSubmit(trimmedValue);
    } else {
      // No text - close the form
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit();
      } else {
        // Empty field - close the form
        onCancel();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <>
      <textarea
        ref={textareaRef}
        className="mb-1 h-14 w-full resize-none rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm shadow placeholder:text-sm focus:border-blue-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <div className="flex items-center gap-1">
        <button
          className="rounded-md bg-[#0c66e4] px-3 py-1 text-sm font-semibold text-white hover:bg-[#0055cc]"
          onClick={handleSubmit}
        >
          Add card
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded text-xl leading-none font-bold text-gray-700 hover:bg-gray-300"
          onClick={onCancel}
          aria-label="Cancel"
        >
          <span className="-mt-0.5">×</span>
        </button>
      </div>
    </>
  );
});

export { CardCreationForm };
