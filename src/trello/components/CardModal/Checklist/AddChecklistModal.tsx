import React, { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import { IconDown } from '../../icons/card-modal/icon-down';
import { useModalForm } from '../../../hooks/use-modal-form';
import { CardModal, IconButton, Input, Button, Text, Dropdown, DropdownItem } from '../../ui';
import { ModalBackHeader } from '../../ui/ModalBackHeader';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useTrelloOperations, useCardsWithChecklistsDetailed } from '@trello/_lib/selectors';

type AddChecklistModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
};

const AddChecklistModal: FC<AddChecklistModalProps> = memo(function AddChecklistModal({
  cardId,
  isOpen,
  onClose,
  onBack,
  buttonRef,
  modalRef: externalModalRef,
}) {
  const { addChecklistSection, copyChecklistFromCard } = useTrelloOperations();
  const cardsWithChecklists = useCardsWithChecklistsDetailed();
  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalRef = externalModalRef || internalModalRef;
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Stable initial values to prevent infinite re-renders
  const initialValues = useMemo(
    () => ({
      title: 'Checklist',
      selectedSourceCardId: '',
      selectedChecklistId: '',
    }),
    []
  );

  // Stable submit handler
  const handleSubmit = useCallback(
    (values: { title: string; selectedSourceCardId: string; selectedChecklistId: string }) => {
      if (values.title.trim()) {
        if (values.selectedSourceCardId && values.selectedChecklistId) {
          // Copy specific checklist from selected source card
          const sourceCard = cardsWithChecklists.find(
            (card) => card.cardId === values.selectedSourceCardId
          );
          const sourceChecklist = sourceCard?.checklists.find(
            (cl) => cl.id === values.selectedChecklistId
          );

          if (sourceChecklist) {
            // Copy only the specific checklist
            copyChecklistFromCard({
              targetCardId: cardId,
              sourceCardId: values.selectedSourceCardId,
              checklistId: values.selectedChecklistId, // copy specific checklist
              titleOverride: values.title.trim(), // apply user-entered title
            });
          }
        } else {
          // Create a new checklist section on the card with the specified title
          addChecklistSection({ cardId, title: values.title.trim() });
        }
        onClose();
      }
    },
    [cardId, addChecklistSection, copyChecklistFromCard, onClose, cardsWithChecklists]
  );

  // Use modal form hook
  const form = useModalForm<{
    title: string;
    selectedSourceCardId: string;
    selectedChecklistId: string;
  }>({
    isOpen,
    initialValues,
    onSubmit: handleSubmit,
    validate: (values) => !!values.title.trim(),
  });

  // Include current card so users can duplicate a checklist within the same card
  const availableSourceCards = cardsWithChecklists;

  // Modal position
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 350,
    fallbackWidth: 300,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });
  const modalHeight = useDynamicModalHeight();

  // Focus and auto-select title input when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let timeoutId: number | undefined;

    // Use requestAnimationFrame to wait for DOM paint, then setTimeout for reliable selection
    const rafId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        // Check if the modal is still open and input still exists
        if (isOpen && titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }
      }, 10); // Small delay after paint to ensure input is fully ready
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isOpen]);

  // Click outside handling is now managed by CardModal

  return (
    <CardModal
      ref={modalRef}
      title="Add checklist"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      containerClassName={modalHeight.modalContainerClasses}
      className={`w-76 ${modalHeight.modalClasses}`}
      buttonRef={buttonRef}
      customHeader={
        onBack ? (
          <ModalBackHeader title="Add checklist" onBack={onBack} onClose={onClose} />
        ) : undefined
      }
    >
      {/* Content */}
      <div className={`px-3 py-3 ${modalHeight.contentClasses}`}>
        <section>
          {/* Title Input */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="id-checklist">
              Title
            </label>
            <Input
              ref={titleInputRef}
              type="text"
              id="id-checklist"
              value={form.values.title}
              onChange={(e) => form.setValue('title', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  form.handleSubmit();
                }
              }}
              maxLength={512}
              spellCheck={false}
            />
          </div>

          {/* Copy Items From Section */}
          {availableSourceCards.length > 0 && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Copy items from…
              </label>
              <Dropdown
                trigger={
                  <div className="flex min-h-[38px] w-full cursor-pointer items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-gray-300 hover:bg-gray-50">
                    <span
                      className={
                        form.values.selectedChecklistId ? 'text-gray-900' : 'text-gray-500'
                      }
                    >
                      {form.values.selectedChecklistId
                        ? (() => {
                            // Find the selected checklist display text
                            for (const card of availableSourceCards) {
                              const checklist = card.checklists.find(
                                (cl) => cl.id === form.values.selectedChecklistId
                              );
                              if (checklist) {
                                return checklist.title;
                              }
                            }
                            return '(none)';
                          })()
                        : '(none)'}
                    </span>
                    <IconDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  </div>
                }
                position="bottom-left"
                className="block w-full"
                contentClassName="!w-[var(--trigger-width)]"
                usePortal={true}
                useDynamicPositioning={true}
              >
                {/* Clear selection option */}
                <DropdownItem
                  onClick={() => {
                    form.setValue('selectedChecklistId', '');
                    form.setValue('selectedSourceCardId', '');
                  }}
                  className={`border-l-2 border-transparent hover:border-l-blue-500 ${
                    !form.values.selectedChecklistId ? 'bg-blue-50' : ''
                  }`}
                >
                  (none)
                </DropdownItem>

                {/* Render cards and their checklists */}
                {availableSourceCards.map((card) => (
                  <React.Fragment key={card.cardId}>
                    {/* Card title as uninteractable header */}
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-700">
                      {card.cardTitle}
                    </div>
                    {/* Checklist items */}
                    {card.checklists.map((checklist) => (
                      <DropdownItem
                        key={checklist.id}
                        onClick={() => {
                          form.setValue('selectedChecklistId', checklist.id);
                          form.setValue('selectedSourceCardId', card.cardId);
                        }}
                        className={`border-l-2 border-transparent hover:border-l-blue-500 ${
                          form.values.selectedChecklistId === checklist.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        {checklist.title}
                      </DropdownItem>
                    ))}
                  </React.Fragment>
                ))}
              </Dropdown>
            </div>
          )}
        </section>
      </div>

      {/* Fixed Footer */}
      <div className={modalHeight.footerClasses}>
        <div className="px-3 py-3">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={form.handleSubmit}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </CardModal>
  );
});

export { AddChecklistModal };
