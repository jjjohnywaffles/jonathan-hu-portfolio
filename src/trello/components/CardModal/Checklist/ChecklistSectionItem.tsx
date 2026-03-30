import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import type { FC } from 'react';
import { IconChecklist } from '../../icons/card-modal/icon-checklist';
import { IconCheckmark } from '../../icons/card/icon-checkmark';
import { IconClock } from '../../icons/card-modal/icon-clock';
import { IconThreeDots } from '../../icons/card-modal/icon-three-dots';
import { FlexContainer, Button, Input, Text } from '../../ui';
import { useItemListManagement } from '../../../hooks/use-item-list-management';
import { ConfirmDeleteCardModal } from '../ConfirmDeleteCardModal';
import {
  ChecklistItemAssignButton,
  ChecklistItemAssignIconButton,
} from './ChecklistItemAssignButton';
import {
  ChecklistItemDueDateButton,
  ChecklistItemDueDateIconButton,
} from './ChecklistItemDueDateButton';
import { ChecklistItemAction } from './ChecklistItemAction';
import {
  useTrelloOperations,
  useChecklistSectionProgress,
  useIsCardInInbox,
  useChecklist,
} from '@trello/_lib/selectors';
import { AutoSavingEditor } from '@trello/_lib/shims/auto-saving-editor';

type ChecklistSectionItemProps = {
  cardId: string;
  checklistId: string;
  title: string;
  items: Array<{
    label: string;
    checked: boolean;
    assignedTo?: string;
    dueDate?: string;
  }>;
  onOpenAssignModal?: (
    itemIndex: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  assignModalData?: {
    checklistId: string;
    itemIndex: number;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
  } | null;
  onOpenDueDateModal?: (
    itemIndex: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  dueDateModalData?: {
    checklistId: string;
    itemIndex: number;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
  } | null;
  onOpenActionModal?: (
    itemIndex: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  actionModalData?: {
    checklistId: string;
    itemIndex: number;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
  } | null;
};

const ChecklistSectionItem: FC<ChecklistSectionItemProps> = memo(function ChecklistSectionItem({
  cardId,
  checklistId,
  title,
  items,
  onOpenAssignModal,
  assignModalData,
  onOpenDueDateModal,
  dueDateModalData,
  onOpenActionModal,
  actionModalData,
}) {
  const {
    addItemToChecklistSection,
    toggleItemInChecklistSection,
    updateItemInChecklistSection,
    removeItemFromChecklistSection,
    removeChecklistSection,
    updateChecklistTitle,
  } = useTrelloOperations();

  const { completed, total, percentage } = useChecklistSectionProgress(cardId, checklistId);
  const isCardInInbox = useIsCardInInbox(cardId);
  const checklist = useChecklist(checklistId);
  const hideCheckedItems = checklist?.hideCheckedItems ?? false;

  // Refs for assignment modal buttons
  const assignButtonRefs = useRef<Record<number, React.RefObject<HTMLButtonElement | null>>>({});

  // Refs for due date modal buttons
  const dueDateButtonRefs = useRef<Record<number, React.RefObject<HTMLButtonElement | null>>>({});

  // Refs for action modal buttons
  const actionButtonRefs = useRef<Record<number, React.RefObject<HTMLButtonElement | null>>>({});

  // Handler for updating checklist title
  const handleUpdateChecklistTitle = useCallback(
    async (newTitle: string) => {
      if (newTitle.trim() && newTitle !== title) {
        updateChecklistTitle({
          cardId,
          checklistId,
          title: newTitle.trim(),
        });
      }
    },
    [updateChecklistTitle, cardId, checklistId, title]
  );

  // Use item list management hook
  const itemManagement = useItemListManagement({
    onAddItem: useCallback(
      (text: string) => {
        addItemToChecklistSection({
          cardId,
          checklistId,
          item: { label: text, checked: false },
        });
      },
      [cardId, checklistId, addItemToChecklistSection]
    ),

    onEditItem: useCallback(
      (index: number, text: string) => {
        updateItemInChecklistSection({
          cardId,
          checklistId,
          itemIndex: index,
          label: text,
        });
      },
      [cardId, checklistId, updateItemInChecklistSection]
    ),

    onRemoveItem: useCallback(
      (index: number) => {
        removeItemFromChecklistSection({
          cardId,
          checklistId,
          itemIndex: index,
        });
      },
      [cardId, checklistId, removeItemFromChecklistSection]
    ),
  });

  const handleToggleItem = useCallback(
    (itemIndex: number) => {
      toggleItemInChecklistSection({ cardId, checklistId, itemIndex });
    },
    [cardId, checklistId, toggleItemInChecklistSection]
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const checklistSectionRef = useRef<HTMLDivElement>(null);

  // Click outside handler for add item
  useEffect(() => {
    if (!itemManagement.isAddingItem) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        checklistSectionRef.current &&
        !checklistSectionRef.current.contains(event.target as Node)
      ) {
        itemManagement.closeAddItem();
      }
    };

    // Use mousedown to catch clicks before other handlers
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [itemManagement]);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const handleDeleteChecklist = useCallback(() => {
    removeChecklistSection({ cardId, checklistId });
  }, [cardId, checklistId, removeChecklistSection]);

  const { toggleChecklistHideCompleted } = useTrelloOperations();
  const handleToggleCheckedItems = useCallback(() => {
    toggleChecklistHideCompleted({ checklistId });
  }, [toggleChecklistHideCompleted, checklistId]);

  // Get ref for assign button for a specific item
  const getAssignButtonRef = useCallback((itemIndex: number) => {
    if (!assignButtonRefs.current[itemIndex]) {
      assignButtonRefs.current[itemIndex] = React.createRef<HTMLButtonElement>();
    }
    return assignButtonRefs.current[itemIndex];
  }, []);

  // Get ref for due date button for a specific item
  const getDueDateButtonRef = useCallback((itemIndex: number) => {
    if (!dueDateButtonRefs.current[itemIndex]) {
      dueDateButtonRefs.current[itemIndex] = React.createRef<HTMLButtonElement>();
    }
    return dueDateButtonRefs.current[itemIndex];
  }, []);

  // Assignment modal handlers
  const handleOpenAssignModal = useCallback(
    (itemIndex: number) => {
      if (onOpenAssignModal) {
        onOpenAssignModal(itemIndex, getAssignButtonRef(itemIndex));
      }
    },
    [onOpenAssignModal, getAssignButtonRef]
  );

  // Due date modal handlers
  const handleOpenDueDateModal = useCallback(
    (itemIndex: number) => {
      if (onOpenDueDateModal) {
        onOpenDueDateModal(itemIndex, getDueDateButtonRef(itemIndex));
      }
    },
    [onOpenDueDateModal, getDueDateButtonRef]
  );

  // Get ref for action button for a specific item
  const getActionButtonRef = useCallback((itemIndex: number) => {
    if (!actionButtonRefs.current[itemIndex]) {
      actionButtonRefs.current[itemIndex] = React.createRef<HTMLButtonElement>();
    }
    return actionButtonRefs.current[itemIndex];
  }, []);

  // Action modal handlers
  const handleOpenActionModal = useCallback(
    (itemIndex: number) => {
      if (onOpenActionModal) {
        onOpenActionModal(itemIndex, getActionButtonRef(itemIndex));
      }
    },
    [onOpenActionModal, getActionButtonRef]
  );

  return (
    <>
      <div ref={checklistSectionRef} className="mb-6">
        {/* Checklist Header */}
        <div className="mb-2 flex items-center gap-2">
          <IconChecklist className="h-5 w-5 flex-shrink-0 text-gray-600" />
          <div className="min-w-0 flex-1">
            <AutoSavingEditor
              value={title}
              onSave={handleUpdateChecklistTitle}
              placeholder="Checklist title"
              className="!w-full !rounded-sm !bg-transparent !px-2 !py-1 !text-base font-semibold text-gray-800 hover:!bg-gray-50 focus:!border-transparent focus:!bg-white focus:!ring-2 focus:!ring-blue-500 focus:!outline-none"
            />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Hide/Show checked items button - only show when there are completed items */}
            {completed > 0 && (
              <Button
                onClick={handleToggleCheckedItems}
                variant="ghost"
                size="sm"
                className="cursor-pointer rounded bg-gray-100 text-black hover:bg-gray-200"
              >
                {hideCheckedItems ? `Show checked items (${completed})` : 'Hide checked items'}
              </Button>
            )}
            <Button
              ref={deleteButtonRef}
              onClick={() => setIsDeleteModalOpen(true)}
              variant="ghost"
              size="sm"
              className="cursor-pointer rounded bg-gray-100 text-black hover:bg-gray-200"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex w-5 justify-center">
            <Text variant="caption" className="text-gray-600">
              {Math.round(percentage)}%
            </Text>
          </div>
          <div className="h-2 flex-1 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {hideCheckedItems && completed === total ? (
            // Show completion message when all items are checked and hidden
            <div className="mb-2 flex items-center gap-2">
              <div className="w-5" />
              <Text variant="body" className="text-gray-600">
                Everything in this checklist is complete!
              </Text>
            </div>
          ) : (
            // Filter and display items based on hideCheckedItems state
            items
              .map((item, index) => {
                // Skip checked items if hideCheckedItems is true
                if (hideCheckedItems && item.checked) {
                  return null;
                }

                // Check if this item has an open assignment modal, due date modal, or action modal
                const hasOpenAssignModal =
                  assignModalData?.checklistId === checklistId &&
                  assignModalData?.itemIndex === index;
                const hasOpenDueDateModal =
                  dueDateModalData?.checklistId === checklistId &&
                  dueDateModalData?.itemIndex === index;
                const hasOpenActionModal =
                  actionModalData?.checklistId === checklistId &&
                  actionModalData?.itemIndex === index;
                const hasOpenModal =
                  hasOpenAssignModal || hasOpenDueDateModal || hasOpenActionModal;

                // Check if this item has assigned data (user assignment or due date)
                const hasAssignedData = !!item.assignedTo || !!item.dueDate;

                return (
                  <div key={index} className="group relative">
                    <FlexContainer align="start" gap="2">
                      {/* Checkbox area - matches percentage width */}
                      <div className="flex w-5 justify-center">
                        <button
                          onClick={() => handleToggleItem(index)}
                          className={`mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-2 transition-colors ${
                            item.checked
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {item.checked && <IconCheckmark className="h-3 w-3" />}
                        </button>
                      </div>
                      {itemManagement.editingItemIndex === index ? (
                        <div className="mt-1 flex-1 space-y-2 rounded-lg bg-gray-100 p-3">
                          <textarea
                            ref={
                              itemManagement.editItemInputRef as React.RefObject<HTMLTextAreaElement>
                            }
                            value={itemManagement.editingItemText}
                            onChange={(e) => itemManagement.setEditingItemText(e.target.value)}
                            onKeyDown={itemManagement.handleEditKeyDown}
                            className="w-full resize-none overflow-hidden rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            rows={1}
                          />
                          <FlexContainer gap="2" justify="between" className="w-full">
                            {/* Left side - Save and Cancel buttons */}
                            <FlexContainer gap="2">
                              <Button
                                onClick={itemManagement.saveEditedItem}
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={itemManagement.cancelEditItem}
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </FlexContainer>

                            {/* Right side - Item action buttons */}
                            <FlexContainer gap="2">
                              {!isCardInInbox && (
                                <>
                                  <ChecklistItemAssignButton
                                    ref={getAssignButtonRef(index)}
                                    cardId={cardId}
                                    checklistId={checklistId}
                                    itemIndex={index}
                                    onClick={() => handleOpenAssignModal(index)}
                                  />
                                  <ChecklistItemDueDateButton
                                    ref={getDueDateButtonRef(index)}
                                    cardId={cardId}
                                    checklistId={checklistId}
                                    itemIndex={index}
                                    onClick={() => handleOpenDueDateModal(index)}
                                  />
                                </>
                              )}
                              <Button
                                ref={getActionButtonRef(index)}
                                onClick={() => handleOpenActionModal(index)}
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer text-gray-600 hover:text-gray-800"
                                title="Item actions"
                              >
                                <IconThreeDots className="h-4 w-4" />
                              </Button>
                            </FlexContainer>
                          </FlexContainer>
                        </div>
                      ) : (
                        <div className="relative -mt-1 min-w-0 flex-1">
                          <button
                            onClick={() => itemManagement.startEditingItem(index, item.label)}
                            className={`w-full cursor-pointer rounded px-1 py-1 pr-24 text-left text-sm leading-relaxed transition-colors ${
                              hasOpenModal || hasAssignedData
                                ? 'bg-gray-100'
                                : 'group-hover:bg-gray-100'
                            } ${item.checked ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                          >
                            <span className="block break-words whitespace-pre-wrap">
                              {item.label}
                            </span>
                          </button>
                        </div>
                      )}
                    </FlexContainer>

                    {/* Hover Icons - Positioned relative to the full width container */}
                    {itemManagement.editingItemIndex !== index && (
                      <div
                        className={`absolute top-1/2 right-1 flex -translate-y-1/2 gap-1 transition-opacity ${
                          hasOpenModal || hasAssignedData
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {!isCardInInbox && (
                          <>
                            {/* Due Date Icon */}
                            <ChecklistItemDueDateIconButton
                              ref={getDueDateButtonRef(index)}
                              cardId={cardId}
                              checklistId={checklistId}
                              itemIndex={index}
                              onClick={() => handleOpenDueDateModal(index)}
                            />

                            {/* Assign Icon */}
                            <ChecklistItemAssignIconButton
                              ref={getAssignButtonRef(index)}
                              cardId={cardId}
                              checklistId={checklistId}
                              itemIndex={index}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleOpenAssignModal(index);
                              }}
                            />
                          </>
                        )}

                        {/* Actions Icon */}
                        <button
                          ref={getActionButtonRef(index)}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleOpenActionModal(index);
                          }}
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
                          title="Item actions"
                        >
                          <IconThreeDots className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
              .filter(Boolean) // Remove null items
          )}
        </div>

        {/* Add Item Section */}
        {itemManagement.isAddingItem ? (
          <div className="mt-1 flex gap-2">
            {/* Empty space to match checkbox area */}
            <div className="w-5 flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <textarea
                ref={itemManagement.addItemInputRef as React.RefObject<HTMLTextAreaElement>}
                value={itemManagement.newItemText}
                onChange={(e) => itemManagement.setNewItemText(e.target.value)}
                onKeyDown={itemManagement.handleAddKeyDown}
                placeholder="Add an item"
                className="w-full resize-none overflow-hidden rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                rows={1}
              />
              <FlexContainer gap="2">
                <Button
                  onClick={itemManagement.saveNewItem}
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </Button>
                <Button
                  onClick={itemManagement.cancelAddItem}
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </FlexContainer>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex gap-2">
            {/* Empty space to match checkbox area */}
            <div className="w-5 flex-shrink-0" />
            <Button
              onClick={itemManagement.startAddingItem}
              variant="ghost"
              size="sm"
              className="cursor-pointer rounded bg-gray-100 text-black hover:bg-gray-200"
            >
              Add an item
            </Button>
          </div>
        )}
      </div>
      {/* Delete Checklist Confirmation Modal (reuse generic delete modal) */}
      <ConfirmDeleteCardModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteChecklist}
        buttonRef={deleteButtonRef as React.RefObject<HTMLElement>}
        placement="bottom-start"
        offset={0}
        lockOnOpen={true}
        viewportPadding={0}
        reflowOnScroll={true}
        reflowOnResize={true}
        titleText={`Delete ${title}?`}
        bodyText="Deleting a checklist is permanent and there is no way to get it back."
        confirmButtonText="Delete checklist"
      />
    </>
  );
});

export { ChecklistSectionItem };
