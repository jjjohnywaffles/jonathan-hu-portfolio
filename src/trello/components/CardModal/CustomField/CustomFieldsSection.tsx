import React, { memo } from 'react';
import type { FC } from 'react';
import { IconCustomFields } from '../../icons/card-modal/icon-custom-fields';
import { IconDropDown } from '../../icons/CustomFieldsIcons/IconDropDown';
import { IconDate } from '../../icons/CustomFieldsIcons/IconDate';
import { IconCheckbox } from '../../icons/CustomFieldsIcons/IconCheckbox';
import { IconNumber } from '../../icons/CustomFieldsIcons/IconNumber';
import { IconText } from '../../icons/CustomFieldsIcons/IconText';
import { IconDown } from '../../icons/card-modal/icon-down';
import { Dropdown, DropdownItem, DropdownSeparator } from '../../ui';

import { ValidatedCustomFieldInput } from './validated-custom-field-input';
import {
  useCardCustomFields,
  useCustomFieldDefinition,
  useTrelloOperations,
} from '@trello/_lib/selectors';

type CustomFieldsSectionProps = {
  cardId: string;
  onOpenCustomFieldModal: () => void;
  editButtonRef?: React.RefObject<HTMLButtonElement | null>;
  onOpenCalendarModal?: (
    fieldId: string,
    fieldName: string,
    currentValue?: string,
    buttonRef?: HTMLButtonElement | null
  ) => void;
};

const CustomFieldsSection: FC<CustomFieldsSectionProps> = memo(function CustomFieldsSection({
  cardId,
  onOpenCustomFieldModal,
  editButtonRef,
  onOpenCalendarModal,
}) {
  const customFields = useCardCustomFields(cardId);
  const { updateCustomFieldValue } = useTrelloOperations();

  // If no custom fields exist, don't render anything
  if (!customFields || customFields.length === 0) {
    return null;
  }

  const handleOptionSelect = (fieldId: string, option: string) => {
    updateCustomFieldValue({
      cardId,
      fieldId,
      value: option,
    });
  };

  const handleClearValue = (fieldId: string) => {
    updateCustomFieldValue({
      cardId,
      fieldId,
      value: undefined,
    });
  };

  const handleOpenDatePicker = (
    fieldId: string,
    fieldName: string,
    currentValue?: string,
    buttonElement?: HTMLButtonElement | null
  ) => {
    onOpenCalendarModal?.(fieldId, fieldName, currentValue, buttonElement);
  };

  return (
    <section className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCustomFields className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-800">Custom Fields</h3>
        </div>
        <button
          ref={editButtonRef}
          type="button"
          onClick={onOpenCustomFieldModal}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none"
        >
          Edit
        </button>
      </div>

      <div className="ml-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {customFields.map((field) => {
          // Show dropdown, date, checkbox, number, and text fields
          if (
            field.type !== 'list' &&
            field.type !== 'date' &&
            field.type !== 'checkbox' &&
            field.type !== 'number' &&
            field.type !== 'text'
          )
            return null;

          if (field.type === 'list') {
            const options = field.options || [];
            const currentValue = field.value;
            const selectedOption = currentValue
              ? options.find((opt) => opt.label === currentValue)
              : null;

            return (
              <div key={field.id} className="w-full space-y-2">
                <div className="flex w-full items-center gap-2">
                  <IconDropDown className="h-4 w-4 flex-shrink-0 text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-700">
                      {field.name}
                    </span>
                  </div>
                </div>

                {/* Only render dropdown if there are options */}
                {options.length > 0 && (
                  <div className="w-full">
                    <Dropdown
                      trigger={
                        <div className="flex min-h-[38px] w-full cursor-pointer items-center justify-between rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm transition-colors hover:border-gray-300 hover:bg-gray-200">
                          <div className="flex flex-1 items-center gap-2">
                            <span
                              className={`text-left ${currentValue ? 'text-gray-900' : 'text-gray-500'}`}
                            >
                              {currentValue || 'Select...'}
                            </span>
                          </div>
                          <IconDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </div>
                      }
                      position="bottom-left"
                      className="block w-full"
                      usePortal={true}
                      useDynamicPositioning={true}
                    >
                      {/* Clear value option at the top */}
                      <DropdownItem
                        onClick={() => handleClearValue(field.id)}
                        className={!currentValue ? 'bg-blue-50' : ''}
                      >
                        --
                      </DropdownItem>

                      {options.map((option, index) => (
                        <DropdownItem
                          key={index}
                          onClick={() => handleOptionSelect(field.id, option.label)}
                          className={currentValue === option.label ? 'bg-blue-50' : ''}
                        >
                          {option.label}
                        </DropdownItem>
                      ))}
                    </Dropdown>
                  </div>
                )}
              </div>
            );
          }

          if (field.type === 'date') {
            const currentValue = field.value;

            return (
              <div key={field.id} className="w-full space-y-2">
                <div className="flex w-full items-center gap-2">
                  <IconDate className="h-4 w-4 flex-shrink-0 text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-700">
                      {field.name}
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  <button
                    type="button"
                    onClick={(e) =>
                      handleOpenDatePicker(field.id, field.name, currentValue, e.currentTarget)
                    }
                    className="flex min-h-[38px] w-full cursor-pointer items-center justify-between rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm transition-colors hover:border-gray-300 hover:bg-gray-200"
                  >
                    <div className="flex items-center gap-1">
                      {currentValue ? (
                        <span className="text-gray-900">{currentValue}</span>
                      ) : (
                        <>
                          <span className="text-base font-normal text-black">+</span>
                          <span className="text-black">Add date...</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          }

          if (field.type === 'checkbox') {
            const currentValue = field.value;
            const isChecked = currentValue === 'true';

            return (
              <div key={field.id} className="w-full space-y-2">
                <div className="flex w-full items-center gap-2">
                  <IconCheckbox className="h-4 w-4 flex-shrink-0 text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-700">
                      {field.name}
                    </span>
                  </div>
                </div>

                <div className="flex w-full items-center">
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomFieldValue({
                        cardId,
                        fieldId: field.id,
                        value: isChecked ? 'false' : 'true',
                      })
                    }
                    className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                      isChecked
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    {isChecked && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          }

          if (field.type === 'number') {
            return (
              <ValidatedCustomFieldInput
                key={field.id}
                cardId={cardId}
                fieldId={field.id}
                fieldName={field.name}
                value={field.value}
                placeholder="Enter number..."
                icon={IconNumber}
                validate={(v) => /^-?(\d+\.?\d*|\d*\.\d+)$/.test(v)}
              />
            );
          }

          if (field.type === 'text') {
            return (
              <ValidatedCustomFieldInput
                key={field.id}
                cardId={cardId}
                fieldId={field.id}
                fieldName={field.name}
                value={field.value}
                placeholder="Enter text..."
                icon={IconText}
                validate={() => true}
              />
            );
          }

          return null;
        })}
      </div>
    </section>
  );
});

export { CustomFieldsSection };
