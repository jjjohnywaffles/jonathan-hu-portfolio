import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CardModal } from '../../ui/CardModal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Dropdown, DropdownItem } from '../../ui';
import { IconDown } from '../../icons/card-modal/icon-down';
import { IconCheckmark } from '../../icons/card/icon-checkmark';
import { IconCheckbox } from '../../icons/CustomFieldsIcons/IconCheckbox';
import { IconDate } from '../../icons/CustomFieldsIcons/IconDate';
import { IconDropDown } from '../../icons/CustomFieldsIcons/IconDropDown';
import { IconNumber } from '../../icons/CustomFieldsIcons/IconNumber';
import { IconText } from '../../icons/CustomFieldsIcons/IconText';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useTrelloOperations, useCustomFieldDefinitions } from '@trello/_lib/selectors';

type FieldType = 'checkbox' | 'date' | 'dropdown' | 'number' | 'text';

type NewFieldModalProps = {
  cardId?: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
};

const FIELD_TYPE_OPTIONS: Array<{
  value: FieldType;
  label: string;
  disabled?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
}> = [
  {
    value: 'checkbox',
    label: 'Checkbox',
    icon: <IconCheckbox className="h-4 w-4 text-gray-600" />,
  },
  {
    value: 'date',
    label: 'Date',
    icon: <IconDate className="h-4 w-4 text-gray-600" />,
  },
  {
    value: 'dropdown',
    label: 'Dropdown',
    icon: <IconDropDown className="h-4 w-4 text-gray-600" />,
  },
  {
    value: 'number',
    label: 'Number',
    icon: <IconNumber className="h-4 w-4 text-gray-600" />,
  },
  {
    value: 'text',
    label: 'Text',
    icon: <IconText className="h-4 w-4 text-gray-600" />,
  },
];

const NewFieldModal: FC<NewFieldModalProps> = memo(function NewFieldModal({
  cardId,
  isOpen,
  onClose,
  buttonRef,
  modalRef: externalModalRef,
}) {
  const { createCustomFieldDefinition, addCustomFieldToCard } = useTrelloOperations();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Get current board's custom field definitions
  const boardCustomFieldDefinitions = useCustomFieldDefinitions();

  // Form state
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType>('dropdown');
  const [showOnFront, setShowOnFront] = useState(true);

  // Modal positioning
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: externalModalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 320,
    fallbackHeight: 350,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setSelectedType('dropdown');
      setShowOnFront(true);
    }
    return undefined;
  }, [isOpen]);

  // Check for duplicate field (same name and type)
  const duplicateError = useMemo(() => {
    if (!title.trim()) return null;

    const normalizedTitle = title.trim().toLowerCase();
    const fieldType = selectedType === 'dropdown' ? 'list' : selectedType;

    const duplicate = boardCustomFieldDefinitions.find(
      (def: any) => def.name.toLowerCase() === normalizedTitle && def.type === fieldType
    );

    return duplicate
      ? 'A field with that name and type already exists, try a different name...'
      : null;
  }, [title, selectedType, boardCustomFieldDefinitions]);

  const isFormValid = title.trim().length > 0 && !duplicateError;

  const handleCreate = () => {
    if (!isFormValid) return;

    // Backend automatically adds new fields to all cards on the board
    createCustomFieldDefinition({
      name: title.trim(),
      type: selectedType === 'dropdown' ? 'list' : selectedType,
      options: selectedType === 'dropdown' ? [] : undefined,
      showOnFront,
    });

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid) {
      e.preventDefault();
      handleCreate();
    }
  };

  const selectedTypeOption = FIELD_TYPE_OPTIONS.find((option) => option.value === selectedType);
  const selectedTypeLabel = selectedTypeOption?.label || 'Dropdown';
  const selectedTypeIcon = selectedTypeOption?.icon;

  return (
    <CardModal
      ref={externalModalRef}
      title="New field"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      dataAttribute="data-new-field-modal"
      buttonRef={buttonRef}
      containerClassName={`z-[75] ${modalHeight.modalContainerClasses}`}
      className={`font-normal ${modalHeight.modalClasses}`}
    >
      <div className={`p-4 font-normal ${modalHeight.contentClasses}`}>
        <div className="space-y-4">
          <div>
            <label htmlFor="field-title" className="mb-2 block text-sm font-medium text-gray-700">
              Title
            </label>
            <Input
              ref={titleInputRef}
              id="field-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter field title"
              className="w-full"
            />
            {duplicateError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                <span>{duplicateError}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
            <Dropdown
              trigger={
                <div className="flex min-h-[38px] w-full cursor-pointer items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-gray-400">
                  <div className="flex items-center gap-2">
                    {selectedTypeIcon}
                    <span className="text-gray-900">{selectedTypeLabel}</span>
                  </div>
                  <IconDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </div>
              }
              position="bottom-left"
              className="block w-full"
              usePortal={true}
              useDynamicPositioning={true}
            >
              {FIELD_TYPE_OPTIONS.map((option) => (
                <DropdownItem
                  key={option.value}
                  onClick={() => !option.disabled && setSelectedType(option.value)}
                  disabled={option.disabled}
                  className={`${selectedType === option.value ? 'bg-blue-50' : ''} ${
                    option.disabled ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  title={option.disabled ? option.tooltip : undefined}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className={option.disabled ? 'text-gray-400' : ''}>
                        {option.label}
                        {option.disabled && <span className="ml-1 text-xs">(Coming soon)</span>}
                      </span>
                    </div>
                    {selectedType === option.value && (
                      <IconCheckmark className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="show-on-front"
              checked={showOnFront}
              onChange={(e) => setShowOnFront(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="show-on-front" className="cursor-pointer text-sm text-gray-700">
              Show field on front of card
            </label>
          </div>

          <div className={modalHeight.footerClasses}>
            <Button
              onClick={handleCreate}
              disabled={!isFormValid}
              className={`mt-4 w-full ${
                isFormValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400 hover:bg-gray-200'
              } transition-colors`}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </CardModal>
  );
});

export { NewFieldModal };
