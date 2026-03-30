import React, { memo, useState, useRef, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { CardModal, Input, ModalBackHeader } from '../ui';
import { IconChevronLeft } from '../icons/board/icon-chevron-left';
import { useTrelloUI } from '../TrelloUIContext';
import { ConfirmDeleteCardModal } from '../CardModal/ConfirmDeleteCardModal';
import { ArchivedCardItem } from '../ArchivedCardItem';
import { ArchivedCardDisplay, type ArchivedCard } from './ArchivedCardDisplay';
import { ArchivedListItem } from './ArchivedListItem';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useDeleteConfirmation } from '@trello/hooks/use-delete-confirmation';
import { useArchivedCardsSearch } from '@trello/hooks/use-archived-cards-search';
import { useArchivedCardsGrouping } from '@trello/hooks/use-archived-cards-grouping';
import { useArchivedLists, useArchivedCards, useTrelloOperations } from '@trello/_lib/selectors';
import { mockNow } from '@trello/_lib/shims/time';

type ArchivedCardsBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  onBackToBoardMenu?: () => void;
};

const ArchivedCardsBoardModal: FC<ArchivedCardsBoardModalProps> = memo(
  function ArchivedCardsBoardModal({ isOpen, onClose, buttonRef, onBackToBoardMenu }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'lists'>('cards');
    const [pendingCardOpen, setPendingCardOpen] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const { unarchiveCard, deleteCard, unarchiveList, deleteList, updateCard } =
      useTrelloOperations();
    const { openCardModal } = useTrelloUI();
    const archivedLists = useArchivedLists();
    const archivedCards = useArchivedCards();

    // Handle opening card modal after this modal closes
    useEffect(() => {
      if (!isOpen && pendingCardOpen) {
        openCardModal(pendingCardOpen); // Archived cards are never mirrors
        setPendingCardOpen(null);
      }
    }, [isOpen, pendingCardOpen, openCardModal]);

    // Use search hook for filtering cards
    const filteredCards = useArchivedCardsSearch(archivedCards, searchQuery);

    // Filter lists based on search query
    const filteredLists = useMemo(() => {
      if (!searchQuery.trim()) return archivedLists;

      return archivedLists.filter((list) =>
        list.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [archivedLists, searchQuery]);

    // Use grouping hook for date-based grouping
    const groupedCards = useArchivedCardsGrouping(filteredCards);

    // Use delete confirmation hook
    const {
      deleteConfirmId: deleteConfirmCardId,
      deleteButtonElement,
      handleDelete: handleDeleteCard,
      handleConfirmDelete,
      handleCancelDelete,
    } = useDeleteConfirmation((cardId) => deleteCard({ cardId }));

    const handleRestoreCard = (cardId: string) => {
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

    const handleRestoreList = (listId: string) => {
      unarchiveList({ listId });
    };

    const handleDeleteList = (listId: string) => {
      // Permanently delete list and its cards
      deleteList({ listId, deleteCards: true });
    };

    const handleSwitchView = () => {
      setViewMode(viewMode === 'cards' ? 'lists' : 'cards');
      setSearchQuery(''); // Clear search when switching views
    };

    const handleBackToBoardMenu = () => {
      onClose(); // Close the current modal
      onBackToBoardMenu?.(); // Open the board menu modal
    };

    // Use unified anchored positioning
    const position = useAnchoredPosition({
      isOpen,
      anchorRef: buttonRef,
      contentRef: modalRef,
      placement: 'bottom-end',
      offset: 8,
      fallbackWidth: 400,
      fallbackHeight: 500,
      viewportPadding: 10,
      lockOnOpen: true,
      reflowOnScroll: false,
      reflowOnContentResize: false,
    });

    // Use dynamic modal height hook
    const modalHeight = useDynamicModalHeight();

    return (
      <>
        <CardModal
          ref={modalRef}
          title="Archived items"
          isOpen={isOpen}
          onClose={onClose}
          position={{ top: position.top, left: position.left }}
          dataAttribute="data-archived-cards-board-modal"
          buttonRef={buttonRef}
          childModals={[{ isOpen: deleteConfirmCardId != null }]}
          containerClassName={`z-[60] ${modalHeight.modalContainerClasses}`}
          className={`!w-[400px] font-normal ${modalHeight.modalClasses}`}
          customHeader={
            onBackToBoardMenu ? (
              <ModalBackHeader title="Archived items" onBack={handleBackToBoardMenu} />
            ) : undefined
          }
        >
          <div className={`p-3 font-normal ${modalHeight.contentClasses}`}>
            {/* Search bar and switch to lists button */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleSwitchView}
                className="rounded-sm bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                {viewMode === 'cards' ? 'Switch to lists' : 'Switch to cards'}
              </button>
            </div>

            {/* Content sections */}
            <div className="space-y-4">
              {viewMode === 'cards' ? (
                <>
                  {/* Older than 14 days section */}
                  {groupedCards.olderThan14Days.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                        Older than 14 days
                      </h3>
                      <div className="space-y-3">
                        {groupedCards.olderThan14Days.map((card) => (
                          <ArchivedCardItem
                            key={card.id}
                            card={card}
                            onRestore={handleRestoreCard}
                            onDelete={handleDeleteCard}
                            onToggleComplete={handleToggleComplete}
                            onCardClick={handleCardClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past 7 days section */}
                  {groupedCards.past7Days.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                        Past 7 days
                      </h3>
                      <div className="space-y-3">
                        {groupedCards.past7Days.map((card) => (
                          <ArchivedCardItem
                            key={card.id}
                            card={card}
                            onRestore={handleRestoreCard}
                            onDelete={handleDeleteCard}
                            onToggleComplete={handleToggleComplete}
                            onCardClick={handleCardClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {filteredCards.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-500">
                      {searchQuery.trim()
                        ? 'No archived cards match your search.'
                        : 'No archived cards found.'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Archived lists */}
                  {filteredLists.length > 0 ? (
                    <div className="space-y-3">
                      {filteredLists.map((list) => (
                        <ArchivedListItem
                          key={list.id}
                          list={list}
                          onRestore={handleRestoreList}
                          onDelete={handleDeleteList}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      {searchQuery.trim()
                        ? 'No archived lists match your search.'
                        : 'No archived lists found.'}
                    </div>
                  )}
                </>
              )}
            </div>
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
  }
);

export { ArchivedCardsBoardModal };
