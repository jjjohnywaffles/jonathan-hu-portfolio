import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDynamicModalHeight } from '../../../hooks/use-dynamic-modal-height';
import { CardModal, Input, Button, Dropdown, DropdownItem } from '../../ui';
import { IconDoubleArrow } from '../../icons/CustomFieldsIcons/IconDoubleArrow';
import { IconFlag } from '../../icons/CustomFieldsIcons/IconFlag';
import { IconDropDown } from '../../icons/CustomFieldsIcons/IconDropDown';
import { IconDate } from '../../icons/CustomFieldsIcons/IconDate';
import { IconCheckbox } from '../../icons/CustomFieldsIcons/IconCheckbox';
import { IconNumber } from '../../icons/CustomFieldsIcons/IconNumber';
import { IconText } from '../../icons/CustomFieldsIcons/IconText';
import { IconChevronRight } from '../../icons/board/icon-chevron-right';
import { ModalBackHeader } from '../../ui/ModalBackHeader';
import { IconDown } from '../../icons/card-modal/icon-down';
import { IconCheckmark } from '../../icons/card/icon-checkmark';
import { IconTrash } from '../../icons/card-modal/icon-trash';
import { ReorderDropdown } from './ReorderDropdown';
import { ColorPickerModal } from './ColorPickerModal';
import { FieldEditorContent } from './FieldEditorContent';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import {
  useCard,
  useTrelloOperations,
  useCardCustomFields,
  useSuggestedFieldTemplates,
  useCustomFieldDefinition,
  useCustomFieldDefinitions,
} from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';

type CustomFieldModalProps = {
  cardId?: string;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
};

type FieldType = 'checkbox' | 'date' | 'dropdown' | 'number' | 'text';
type NormalizedFieldType = Exclude<FieldType, 'dropdown'> | 'list';

type ModalView = 'list' | 'newField' | 'editField';

// Icon mapping for suggested field templates
const SUGGESTED_FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'priority-template': IconDoubleArrow,
  'status-template': IconFlag,
  'risk-template': IconFlag,
  'effort-template': IconDoubleArrow,
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

// Function to get icon based on field type
const getFieldIcon = (type: string): React.ComponentType<{ className?: string }> => {
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
};

const normalizeFieldType = (type: FieldType | null): NormalizedFieldType | null => {
  if (type == null) {
    return null;
  }
  return type === 'dropdown' ? 'list' : type;
};

const CustomFieldModal: FC<CustomFieldModalProps> = memo(function CustomFieldModal({
  cardId,
  isOpen,
  onClose,
  onBack,
  buttonRef,
  modalRef,
}) {
  const card = useCard(cardId || '');
  const {
    createCustomFieldFromTemplate,
    addCustomFieldToCard,
    reorderCustomFieldDefinition,
    createCustomFieldDefinition,
    updateCustomFieldDefinition,
    addCustomFieldOption,
    removeCustomFieldOption,
    updateCustomFieldOption,
    reorderCustomFieldOption,
    deleteCustomFieldDefinition,
  } = useTrelloOperations();

  // For board menu access (no cardId), get custom fields directly from board definitions
  const boardFieldDefinitions = useCustomFieldDefinitions();

  // If accessed from a card, get that card's custom fields
  const cardCustomFields = useCardCustomFields(cardId || '');

  // Use board definitions when no cardId (board menu), otherwise use card's fields
  const displayedFields = !cardId
    ? boardFieldDefinitions.map((def) => ({
        id: def.id,
        name: def.name,
        value: undefined,
        type: def.type,
        options: def.options,
        showOnFront: def.showOnFront,
      }))
    : cardCustomFields;

  const suggestedFieldTemplates = useSuggestedFieldTemplates();

  // View state
  const [currentView, setCurrentView] = useState<ModalView>('list');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const selectedFieldDef = useCustomFieldDefinition(selectedFieldId ?? '');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');

  // New field form state
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType | null>(null);
  const [showOnFront, setShowOnFront] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteView, setIsDeleteView] = useState(false);
  const [deleteFieldInputValue, setDeleteFieldInputValue] = useState('');
  const deleteFieldInputRef = useRef<HTMLInputElement>(null);

  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef ?? internalModalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 300,
    fallbackWidth: 280,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: true,
  });
  const modalHeight = useDynamicModalHeight();

  // Reset to list view when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView('list');
    }
  }, [isOpen]);

  // Reset new field form when switching views
  useEffect(() => {
    if (currentView === 'newField') {
      setTitle('');
      setSelectedType(null);
      setShowOnFront(true);
      // Focus title input
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else if (currentView !== 'editField') {
      setIsDeleteView(false);
      setDeleteFieldInputValue('');
    }
  }, [currentView]);

  useEffect(() => {
    if (isDeleteView) {
      const timer = setTimeout(() => deleteFieldInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
    setDeleteFieldInputValue('');
    return undefined;
  }, [isDeleteView]);

  // Color picker modal state for option color changes
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorPickerOptionIndex, setColorPickerOptionIndex] = useState<number | null>(null);
  const colorPickerButtonRef = useRef<HTMLElement | null>(null);
  const colorPickerModalRef = useRef<HTMLDivElement | null>(null);

  const handleAddField = async (templateId: string) => {
    createCustomFieldFromTemplate({
      templateId,
    });
  };

  const handleNewField = () => setCurrentView('newField');
  const handleEditInline = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setCurrentView('editField');
    setIsDeleteView(false);
    setDeleteFieldInputValue('');
  };
  const handleBackToList = () => {
    setCurrentView('list');
    setIsDeleteView(false);
    setDeleteFieldInputValue('');
  };

  const isDeleteFieldEnabled =
    selectedFieldDef != null && deleteFieldInputValue === selectedFieldDef.name;

  const handleConfirmDeleteField = () => {
    if (!selectedFieldDef || !isDeleteFieldEnabled) {
      return;
    }
    deleteCustomFieldDefinition({ fieldId: selectedFieldDef.id });
    setIsDeleteView(false);
    setDeleteFieldInputValue('');
    setCurrentView('list');
    setSelectedFieldId(null);
  };

  const handleReorderField = (fieldId: string, direction: 'up' | 'down') => {
    reorderCustomFieldDefinition({ fieldId, direction });
  };

  const normalizedFieldType = useMemo(() => normalizeFieldType(selectedType), [selectedType]);
  const trimmedTitle = useMemo(() => title.trim(), [title]);
  const normalizedTitle = useMemo(() => trimmedTitle.toLowerCase(), [trimmedTitle]);

  const handleCreateField = () => {
    if (!isFormValid || normalizedFieldType == null) {
      return;
    }

    createCustomFieldDefinition({
      name: trimmedTitle,
      type: normalizedFieldType,
      options: normalizedFieldType === 'list' ? [] : undefined,
      showOnFront,
    });

    setCurrentView('list');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && trimmedTitle.length > 0) {
      e.preventDefault();
      handleCreateField();
    }
  };

  const availableSuggestedFields = suggestedFieldTemplates.filter(
    (template: any) => !boardFieldDefinitions.some((def: any) => def.name === template.name)
  );

  // Check for duplicate field (same name and type) in new field view
  const duplicateError = useMemo(() => {
    if (currentView !== 'newField' || !trimmedTitle || normalizedFieldType == null) {
      return null;
    }

    const duplicate = boardFieldDefinitions.find(
      (def: any) => def.name.toLowerCase() === normalizedTitle && def.type === normalizedFieldType
    );

    return duplicate
      ? 'A field with that name and type already exists, try a different name...'
      : null;
  }, [currentView, trimmedTitle, normalizedTitle, normalizedFieldType, boardFieldDefinitions]);

  const selectedTypeOption = selectedType
    ? FIELD_TYPE_OPTIONS.find((option) => option.value === selectedType)
    : null;
  const selectedTypeLabel = selectedTypeOption?.label || 'Select...';
  const selectedTypeIcon = selectedTypeOption?.icon;
  const isFormValid = Boolean(trimmedTitle) && normalizedFieldType != null && !duplicateError;

  return (
    <>
      <CardModal
        ref={modalRef || internalModalRef}
        title={
          currentView === 'list'
            ? 'Custom Fields'
            : currentView === 'newField'
              ? 'New field'
              : 'Edit field'
        }
        isOpen={isOpen}
        onClose={onClose}
        position={modalPosition}
        dataAttribute="data-custom-fields-modal"
        buttonRef={buttonRef}
        childModals={[{ isOpen: isColorPickerOpen }]}
        containerClassName={`z-[70] ${modalHeight.modalContainerClasses}`}
        className={`font-normal ${modalHeight.modalClasses}`}
        customHeader={
          currentView === 'newField' ? (
            <ModalBackHeader title="New field" onBack={handleBackToList} onClose={onClose} />
          ) : currentView === 'editField' ? (
            <ModalBackHeader
              title={isDeleteView ? 'Delete field?' : 'Edit field'}
              onBack={isDeleteView ? () => setIsDeleteView(false) : handleBackToList}
              onClose={onClose}
            />
          ) : currentView === 'list' && onBack ? (
            <ModalBackHeader title="Custom Fields" onBack={onBack} onClose={onClose} />
          ) : undefined
        }
      >
        {currentView === 'list' ? (
          <>
            <div className={`p-3 font-normal ${modalHeight.contentClasses}`}>
              {/* Custom fields section - shows for both card and board menu access */}
              {displayedFields && displayedFields.length > 0 && (
                <div className="mb-4">
                  <div className="space-y-1">
                    {displayedFields.map((field: any, index: number) => {
                      const canMoveUp = index > 0;
                      const canMoveDown = index < displayedFields.length - 1;
                      const showReorderButton = displayedFields.length > 1;

                      return (
                        <div
                          key={field.id}
                          className={`flex w-full items-center rounded-sm px-2 ${showReorderButton ? 'gap-2' : ''}`}
                        >
                          {showReorderButton && (
                            <ReorderDropdown
                              fieldId={field.id}
                              canMoveUp={canMoveUp}
                              canMoveDown={canMoveDown}
                              onReorder={handleReorderField}
                            />
                          )}

                          <button
                            type="button"
                            className={`flex items-center justify-between rounded bg-gray-100 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900 ${showReorderButton ? 'flex-1' : 'w-full'}`}
                            onClick={() => handleEditInline(field.id)}
                          >
                            <div className="flex items-center gap-2">
                              {(() => {
                                const IconComponent = getFieldIcon(field.type);
                                return <IconComponent className="h-4 w-4 text-gray-600" />;
                              })()}
                              {field.name}
                            </div>
                            <IconChevronRight className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableSuggestedFields.length > 0 && (
                <>
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                    SUGGESTED FIELDS
                  </h3>
                  <div className="space-y-1">
                    {availableSuggestedFields.map((template: any) => {
                      const IconComponent = SUGGESTED_FIELD_ICONS[template.id] || IconDropDown;
                      return (
                        <div
                          key={template.id}
                          className="flex items-center justify-between rounded-sm px-2 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2 py-1.5">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{template.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddField(template.id)}
                            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none"
                          >
                            Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Fixed Footer */}
            <div className={modalHeight.footerClasses}>
              <div className="p-3 pt-0">
                <button
                  type="button"
                  onClick={handleNewField}
                  className="mt-4 flex w-full items-center justify-center gap-1 rounded-sm bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none"
                >
                  <span className="text-base font-normal">+</span>
                  <span>New field</span>
                </button>
              </div>
            </div>
          </>
        ) : currentView === 'newField' ? (
          <div className={`p-4 font-normal text-gray-900 ${modalHeight.contentClasses}`}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="field-title"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
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
                      <span className={selectedType ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedTypeLabel}
                      </span>
                      <IconDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </div>
                  }
                  position="bottom-left"
                  className="block w-full"
                  contentClassName="!w-[248px]"
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
                        <span className={option.disabled ? 'text-gray-400' : ''}>
                          {option.label}
                          {option.disabled && <span className="ml-1 text-xs">(Coming soon)</span>}
                        </span>
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
                  onClick={handleCreateField}
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
        ) : (
          <div className={`p-3 font-normal ${modalHeight.contentClasses}`}>
            {selectedFieldDef ? (
              isDeleteView ? (
                <div className="space-y-4 text-sm text-gray-700">
                  <p>
                    Values in this custom field will be deleted from all cards on this board. This
                    can't be undone.
                  </p>
                  <p>
                    To delete the field and its data, enter the field name:{' '}
                    <strong>{selectedFieldDef.name}</strong>
                  </p>
                  <Input
                    ref={deleteFieldInputRef}
                    type="text"
                    value={deleteFieldInputValue}
                    onChange={(e) => setDeleteFieldInputValue(e.target.value)}
                    placeholder="Field name"
                    className="w-full"
                  />
                  <Button
                    onClick={handleConfirmDeleteField}
                    disabled={!isDeleteFieldEnabled}
                    className={`w-full ${
                      isDeleteFieldEnabled
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'cursor-not-allowed bg-gray-200 text-gray-400 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Delete field
                  </Button>
                </div>
              ) : (
                <>
                  <FieldEditorContent
                    field={selectedFieldDef}
                    onUpdateTitle={(val: string) =>
                      updateCustomFieldDefinition({
                        fieldId: selectedFieldDef.id,
                        updates: { name: val },
                      })
                    }
                    onToggleShowOnFront={(show: boolean) =>
                      updateCustomFieldDefinition({
                        fieldId: selectedFieldDef.id,
                        updates: { showOnFront: show },
                      })
                    }
                    onOpenColorPicker={(idx: number, el: HTMLElement) => {
                      colorPickerButtonRef.current = el;
                      setColorPickerOptionIndex(idx);
                      setIsColorPickerOpen(true);
                    }}
                    onReorderOption={(idx: number, dir: 'up' | 'down') =>
                      reorderCustomFieldOption({
                        fieldId: selectedFieldDef.id,
                        sourceIndex: idx,
                        destinationIndex: dir === 'up' ? idx - 1 : idx + 1,
                      })
                    }
                    onRemoveOption={(idx: number) =>
                      removeCustomFieldOption({
                        fieldId: selectedFieldDef.id,
                        optionIndex: idx,
                      })
                    }
                    onRenameOption={(idx: number, newLabel: string) =>
                      updateCustomFieldOption({
                        fieldId: selectedFieldDef.id,
                        optionIndex: idx,
                        newOption: newLabel,
                      })
                    }
                    onAddOption={(label: string) =>
                      addCustomFieldOption({
                        fieldId: selectedFieldDef.id,
                        option: label,
                      })
                    }
                  />
                  <div className="mt-3 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setIsDeleteView(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Delete field
                    </button>
                  </div>
                </>
              )
            ) : (
              <div className="text-sm text-gray-600">Field not found.</div>
            )}
          </div>
        )}
      </CardModal>
      {/* Color Picker Modal for dropdown options */}
      {currentView === 'editField' && selectedFieldDef && (
        <ColorPickerModal
          isOpen={isColorPickerOpen}
          onClose={() => setIsColorPickerOpen(false)}
          onColorSelect={(color: string) => {
            if (
              colorPickerOptionIndex != null &&
              selectedFieldDef?.options?.[colorPickerOptionIndex]
            ) {
              const label = selectedFieldDef.options[colorPickerOptionIndex]?.label ?? '';
              updateCustomFieldOption({
                fieldId: selectedFieldDef.id,
                optionIndex: colorPickerOptionIndex,
                newOption: label,
                color,
              });
            }
            setIsColorPickerOpen(false);
          }}
          buttonRef={{ current: colorPickerButtonRef.current }}
          modalRef={colorPickerModalRef}
          currentColor={
            colorPickerOptionIndex != null
              ? selectedFieldDef?.options?.[colorPickerOptionIndex]?.color
              : undefined
          }
        />
      )}
    </>
  );
});

export { CustomFieldModal };
