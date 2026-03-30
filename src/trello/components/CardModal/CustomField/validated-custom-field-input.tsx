import React, { memo, useEffect, useState } from 'react';
import type { FC } from 'react';
import { useTrelloOperations } from '@trello/_lib/selectors';

type ValidatedCustomFieldInputProps = {
  cardId: string;
  fieldId: string;
  fieldName: string;
  value?: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  validate: (v: string) => boolean;
};

const ValidatedCustomFieldInput: FC<ValidatedCustomFieldInputProps> = memo(
  function ValidatedCustomFieldInput({
    cardId,
    fieldId,
    fieldName,
    value,
    placeholder,
    icon: Icon,
    validate,
  }) {
    const { updateCustomFieldValue } = useTrelloOperations();

    // Keep local draft so invalid edits don't leak into the global store
    const [draft, setDraft] = useState<string | undefined>(undefined);

    // Reset draft whenever the backing value changes (e.g., due to external updates)
    useEffect(() => {
      setDraft(undefined);
    }, [value, fieldId]);

    const displayValue = draft ?? value ?? '';
    const isValid = displayValue === '' || validate(displayValue);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const newValue = e.target.value;

      if (newValue === '') {
        updateCustomFieldValue({ cardId, fieldId, value: undefined });
        setDraft(undefined);
        return;
      }
      if (validate(newValue)) {
        updateCustomFieldValue({ cardId, fieldId, value: newValue });
        setDraft(undefined);
        return;
      }
      // Invalid input, keep local only
      setDraft(newValue);
    }

    return (
      <div className="w-full space-y-2">
        <div className="flex w-full items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0 text-gray-600" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-gray-700">{fieldName}</span>
          </div>
        </div>

        <div className="w-full">
          <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full rounded border bg-gray-100 px-3 py-2 text-sm transition-colors ${
              isValid
                ? 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white'
                : 'border-red-500 bg-red-50 focus:border-red-500'
            } focus:ring-1 focus:outline-none ${
              isValid ? 'focus:ring-blue-500' : 'focus:ring-red-500'
            }`}
          />
        </div>
      </div>
    );
  }
);

export { ValidatedCustomFieldInput };
