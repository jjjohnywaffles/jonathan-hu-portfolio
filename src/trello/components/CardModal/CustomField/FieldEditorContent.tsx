import React, { memo, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Input, Button } from '../../ui';
import { Tooltip } from '../../Tooltip';
import { IconTrash } from '../../icons/card-modal/icon-trash';
import { IconDropDown } from '../../icons/CustomFieldsIcons/IconDropDown';
import { IconDate } from '../../icons/CustomFieldsIcons/IconDate';
import { IconCheckbox } from '../../icons/CustomFieldsIcons/IconCheckbox';
import { IconNumber } from '../../icons/CustomFieldsIcons/IconNumber';
import { IconText } from '../../icons/CustomFieldsIcons/IconText';
import { ReorderDropdown } from './ReorderDropdown';
import type { CustomFieldDefinition } from '@trello/_lib/types';
import {
  colorOptions as labelColorOptions,
  getLabelColorClass,
  getLabelColorDisplayName,
} from '@trello/utils/label-colors';

type FieldEditorContentProps = {
  field: CustomFieldDefinition;
  onUpdateTitle: (title: string) => void;
  onToggleShowOnFront: (show: boolean) => void;
  onOpenColorPicker: (optionIndex: number, anchorEl: HTMLElement) => void;
  onReorderOption: (optionIndex: number, direction: 'up' | 'down') => void;
  onRemoveOption: (optionIndex: number) => void;
  onRenameOption: (optionIndex: number, newLabel: string) => void;
  onAddOption: (label: string) => void;
};

function getFieldIcon(type: string): React.ComponentType<{ className?: string }> {
  switch (type) {
    case 'date':
      return IconDate;
    case 'list':
      return IconDropDown;
    case 'checkbox':
      return IconCheckbox;
    case 'number':
      return IconNumber;
    case 'text':
      return IconText;
    default:
      return IconDropDown;
  }
}

export const FieldEditorContent: FC<FieldEditorContentProps> = memo(function FieldEditorContent({
  field,
  onUpdateTitle,
  onToggleShowOnFront,
  onOpenColorPicker,
  onReorderOption,
  onRemoveOption,
  onRenameOption,
  onAddOption,
}) {
  function getColorNameFromHex(hex?: string): string {
    if (hex == null || hex === '') {
      return 'None';
    }
    const keys = labelColorOptions.flat();
    for (const key of keys) {
      const cls = getLabelColorClass(key); // e.g., bg-[#4cce97]
      if (cls.includes(hex)) {
        return getLabelColorDisplayName(key);
      }
    }
    return hex;
  }
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const optionEditInputRef = useRef<HTMLInputElement>(null);
  const IconComponent = getFieldIcon(field.type);

  // When entering option edit mode, auto-focus and select text so typing works immediately
  useEffect(() => {
    if (editingOptionIndex != null) {
      const el = optionEditInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [editingOptionIndex]);

  return (
    <div className="font-normal">
      {/* Title Section */}
      <div className="mb-3">
        <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 uppercase">
          Title
        </label>
        <Input
          ref={titleInputRef}
          type="text"
          value={field.name}
          onChange={(e) => onUpdateTitle(e.target.value)}
        />
      </div>

      {/* Type Section (read-only) */}
      <div className="mb-3">
        <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 uppercase">
          Type
        </label>
        <div className="flex items-center gap-2 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
          <IconComponent className="h-4 w-4" />
          <span>
            {field.type === 'list'
              ? 'Dropdown'
              : field.type.charAt(0).toUpperCase() + field.type.slice(1)}
          </span>
        </div>
      </div>

      {/* Dropdown options editor */}
      {field.type === 'list' && (
        <div className="mb-3">
          <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 uppercase">
            Options
          </label>
          <div className="space-y-2">
            {(field.options ?? []).map((option, index) => {
              const canMoveUp = index > 0;
              const canMoveDown = index < (field.options?.length ?? 0) - 1;
              const showReorder = (field.options?.length ?? 0) > 1;
              return (
                <div key={`${field.id}-opt-${index}`} className="flex items-center gap-2">
                  {showReorder && (
                    <ReorderDropdown
                      fieldId={`${field.id}-option-${index}`}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onReorder={(_, dir) => onReorderOption(index, dir)}
                    />
                  )}
                  <Tooltip
                    content={getColorNameFromHex(option.color)}
                    position="bottom"
                    variant="dark"
                  >
                    <div
                      className="h-6 w-6 cursor-pointer rounded border border-gray-300 transition-colors hover:border-gray-400"
                      style={{ backgroundColor: option.color }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Change option color (${getColorNameFromHex(option.color)})`}
                      onClick={(e) => onOpenColorPicker(index, e.currentTarget)}
                    />
                  </Tooltip>
                  <div className="flex-1">
                    {editingOptionIndex === index ? (
                      <input
                        ref={optionEditInputRef}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                        value={editingOptionValue}
                        onChange={(e) => setEditingOptionValue(e.target.value)}
                        onBlur={() => {
                          if (editingOptionValue.trim()) {
                            onRenameOption(index, editingOptionValue.trim());
                          }
                          setEditingOptionIndex(null);
                          setEditingOptionValue('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          } else if (e.key === 'Escape') {
                            setEditingOptionIndex(null);
                            setEditingOptionValue('');
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="cursor-text rounded border border-transparent px-2 py-1 text-sm text-gray-900 hover:border-gray-300"
                        onClick={() => {
                          setEditingOptionIndex(index);
                          setEditingOptionValue(option.label);
                        }}
                      >
                        {option.label}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="p-1 text-gray-400 transition-colors hover:text-red-500"
                    onClick={() => onRemoveOption(index)}
                    aria-label="Remove option"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              type="text"
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              placeholder="Add item..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newOptionValue.trim()) {
                  onAddOption(newOptionValue.trim());
                  setNewOptionValue('');
                }
              }}
            />
            <Button
              onClick={() => {
                if (!newOptionValue.trim()) return;
                onAddOption(newOptionValue.trim());
                setNewOptionValue('');
              }}
              disabled={!newOptionValue.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Show on front toggle */}
      <div className="mb-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={field.showOnFront === true}
            onChange={(e) => onToggleShowOnFront(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show field on front of card</span>
        </label>
      </div>
    </div>
  );
});
