import React, { memo, useRef } from 'react';
import type { FC } from 'react';
import { CardModal } from '../../ui/CardModal';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useTrelloOperations, useCard, useCardList } from '@trello/_lib/selectors';

type ChecklistItemActionProps = {
  cardId: string;
  checklistId: string;
  itemIndex: number;
  itemLabel: string;
  assignedUserId?: string;
  dueDate?: string;
  isChecked: boolean;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
};

const ChecklistItemAction: FC<ChecklistItemActionProps> = memo(function ChecklistItemAction({
  cardId,
  checklistId,
  itemIndex,
  itemLabel,
  assignedUserId,
  dueDate,
  isChecked,
  isOpen,
  onClose,
  buttonRef,
}) {
  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: internalModalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 120,
    fallbackWidth: 180,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });
  const modalHeight = useDynamicModalHeight();

  const { addCard, assignUserToCard, updateCard, removeItemFromChecklistSection } =
    useTrelloOperations();
  const currentCard = useCard(cardId);
  const currentList = useCardList(cardId);

  const handleConvertToCard = () => {
    if (!currentCard || !currentList) return;

    // Create a new card with the item's label as title in the same list
    const newCardId = addCard({
      listId: currentList.id,
      title: itemLabel,
    });

    // If there's an assigned user, assign them to the new card
    if (assignedUserId) {
      assignUserToCard({ cardId: newCardId, userId: assignedUserId });
    }

    // If there's a due date, set it on the new card
    if (dueDate) {
      updateCard({ cardId: newCardId, updates: { dueDate } });
    }

    // Remove the item from the checklist
    removeItemFromChecklistSection({ cardId, checklistId, itemIndex });

    // Close the modal
    onClose();
  };

  const handleDeleteItem = () => {
    // Remove the item from the checklist
    removeItemFromChecklistSection({ cardId, checklistId, itemIndex });

    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <CardModal
      ref={internalModalRef}
      title="List actions"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      dataAttribute="data-checklist-item-action-modal"
      buttonRef={buttonRef}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
    >
      {/* Content */}
      <div className={modalHeight.contentClasses}>
        <div tabIndex={-1}>
          <div className="py-2">
            <ul>
              <li>
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                  onClick={handleConvertToCard}
                  data-testid="convert-to-card-button"
                  aria-label="Convert to card"
                >
                  <div className="text-sm font-medium text-gray-900">Convert to card</div>
                </button>
              </li>
              <li>
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                  onClick={handleDeleteItem}
                  data-testid="delete-item-button"
                  aria-label="Delete item"
                >
                  <div className="text-sm font-medium text-gray-900">Delete</div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </CardModal>
  );
});

export { ChecklistItemAction };
