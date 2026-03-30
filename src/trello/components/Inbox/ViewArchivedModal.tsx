import React, { memo, useState, useMemo, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { IconSearch } from '../icons/header/IconSearch';
import { CardModal } from '../ui';
import { useTrelloUI } from '../TrelloUIContext';
import { ArchivedCardDisplay, type ArchivedCard } from '../Board/ArchivedCardDisplay';
import { ConfirmDeleteCardModal } from '../CardModal/ConfirmDeleteCardModal';
import { ArchivedCardItem } from '../ArchivedCardItem';
import { useDynamicModalHeight } from '../../hooks/use-dynamic-modal-height';
import { useDeleteConfirmation } from '@trello/hooks/use-delete-confirmation';
import { useArchivedCardsSearch } from '@trello/hooks/use-archived-cards-search';
import { useArchivedCardsGrouping } from '@trello/hooks/use-archived-cards-grouping';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useTrelloOperations, useArchivedListCards } from '@trello/_lib/selectors';
import { mockNow } from '@trello/_lib/shims/time';

type ViewArchivedModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ViewArchivedModal: FC<ViewArchivedModalProps> = memo(function ViewArchivedModal({
  isOpen,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCardOpen, setPendingCardOpen] = useState<string | null>(null);
  const inboxListId = 'inbox';
  const { unarchiveCard, deleteCard, updateCard } = useTrelloOperations();
  const { openCardModal } = useTrelloUI();
  const modalRef = useRef<HTMLDivElement>(null);
  const modalHeight = useDynamicModalHeight();

  // Get archived cards from inbox list only
  const archivedCards = useArchivedListCards(inboxListId) as ArchivedCard[];

  // Handle opening card modal after this modal closes
  useEffect(() => {
    if (!isOpen && pendingCardOpen) {
      openCardModal(pendingCardOpen); // Archived cards are never mirrors
      setPendingCardOpen(null);
    }
  }, [isOpen, pendingCardOpen, openCardModal]);

  // Use search hook for filtering cards
  const filteredCards = useArchivedCardsSearch(archivedCards, searchQuery);

  // Use grouping hook for date-based grouping
  const groupedCards = useArchivedCardsGrouping(filteredCards);

  // Use delete confirmation hook
  const {
    deleteConfirmId: deleteConfirmCardId,
    deleteButtonElement,
    handleDelete: handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeleteConfirmation((cardId) => deleteCard({ cardId }));

  const handleRestore = (cardId: string) => {
    unarchiveCard({ cardId });
  };

  const handleToggleComplete = (cardId: string) => {
    const card = archivedCards.find((c) => c.id === cardId);
    if (card) {
      updateCard({ cardId, updates: { completed: !card.completed } });
    }
  };

  const handleCardClick = (cardId: string) => {
    // Set the card to open after modal closes
    setPendingCardOpen(cardId);
    // Close the archive modal
    onClose();
  };

  // Centered positioning using the shared hook
  const position = useAnchoredPosition({
    isOpen,
    contentRef: modalRef,
    placement: 'center',
    fallbackWidth: 680,
    fallbackHeight: 600,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity" />
      )}
      <CardModal
        ref={modalRef}
        title="Inbox - Archived Cards"
        isOpen={isOpen}
        onClose={onClose}
        position={{ top: position.top, left: position.left }}
        dataAttribute="data-inbox-archived-modal"
        childModals={[{ isOpen: deleteConfirmCardId != null }]}
        containerClassName={`z-[60] ${modalHeight.modalContainerClasses}`}
        className={`!w-[680px] ${modalHeight.modalClasses}`}
      >
        {/* Search */}
        <div className={`p-4 ${modalHeight.footerClasses}`}>
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search archived cards"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className={`space-y-6 p-4 ${modalHeight.contentClasses}`}>
          {/* Past 7 days section */}
          {groupedCards.past7Days.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-500">Past 7 days</h3>
              <div className="grid grid-cols-2 gap-4">
                {groupedCards.past7Days.map((card) => (
                  <ArchivedCardItem
                    key={card.id}
                    card={card}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                    onCardClick={handleCardClick}
                    variant="inbox"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Older than 14 days section */}
          {groupedCards.olderThan14Days.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-500">Older than 14 days</h3>
              <div className="grid grid-cols-2 gap-4">
                {groupedCards.olderThan14Days.map((card) => (
                  <ArchivedCardItem
                    key={card.id}
                    card={card}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                    onCardClick={handleCardClick}
                    variant="inbox"
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {filteredCards.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              {searchQuery.trim()
                ? 'No archived cards match your search.'
                : 'No archived cards found.'}
            </div>
          )}
        </div>
      </CardModal>

      {/* Delete Card Confirmation Modal */}
      <ConfirmDeleteCardModal
        isOpen={deleteConfirmCardId != null}
        onClose={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
        buttonRef={deleteButtonElement ? { current: deleteButtonElement } : undefined}
        placement="bottom-start"
      />
    </>
  );
});

export { ViewArchivedModal };
