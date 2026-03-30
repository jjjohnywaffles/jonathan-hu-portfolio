import React, { memo, useRef, useState, useMemo } from 'react';
import type { FC } from 'react';
import { ChevronLeft } from 'lucide-react';
import { CardModal, ModalBackHeader } from '../ui';
import { IconSort } from '../icons/sidebar/icon-sort';
import { IconArchive } from '../icons/card-modal-action/icon-archive';
import { useDynamicModalHeight } from '../../hooks/use-dynamic-modal-height';
import { ViewArchivedModal } from './ViewArchivedModal';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import {
  useListCards,
  useTrelloOperations,
  useListHasCompletedCards,
  useListCompletedCards,
} from '@trello/_lib/selectors';

type InboxMenuModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
};

const InboxMenuModal: FC<InboxMenuModalProps> = memo(function InboxMenuModal({
  isOpen,
  onClose,
  buttonRef,
}) {
  const inboxListId = 'inbox';
  const inboxCards = useListCards(inboxListId);
  const hasDueDateCards = useMemo(
    () => inboxCards.some((card) => (card?.dueDate?.trim() ?? '').length > 0),
    [inboxCards]
  );
  const { archiveCard, sortCards } = useTrelloOperations();
  const [isViewArchivedModalOpen, setIsViewArchivedModalOpen] = useState(false);
  const [showSortView, setShowSortView] = useState(false);

  // Use memoized selectors for completed cards
  const hasCompletedCards = useListHasCompletedCards(inboxListId);
  const completedCards = useListCompletedCards(inboxListId);

  // Ref for the modal container
  const modalRef = useRef<HTMLDivElement>(null);
  const modalHeight = useDynamicModalHeight();

  // Use the new simplified modal positioning hook
  const estimatedHeight = showSortView ? 160 : hasCompletedCards ? 140 : 100;
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 288,
    fallbackHeight: estimatedHeight,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  const handleSort = () => {
    setShowSortView(true);
  };

  const handleBackToMenu = () => {
    setShowSortView(false);
  };

  const handleSortOption = (sortBy: 'newest' | 'oldest' | 'alphabetical' | 'dueDate') => {
    sortCards({ listId: inboxListId, sortBy });
    console.log(`Sorted by: ${sortBy}`);
    onClose();
  };

  const handleViewArchivedCards = () => {
    setIsViewArchivedModalOpen(true);
    onClose(); // Close the menu modal when opening archived modal
  };

  const handleCloseViewArchivedModal = () => {
    setIsViewArchivedModalOpen(false);
  };

  const handleClose = () => {
    setShowSortView(false); // Reset sort view when modal closes
    onClose();
  };

  const handleArchiveAllCompleted = () => {
    // Archive each completed card
    completedCards.forEach((card) => {
      archiveCard({ cardId: card.id });
    });

    console.log(`Archived ${completedCards.length} completed cards`);
    onClose();
  };

  return (
    <>
      <CardModal
        ref={modalRef}
        title={showSortView ? 'Sort' : 'Menu'}
        customHeader={
          showSortView ? <ModalBackHeader title="Sort" onBack={handleBackToMenu} /> : undefined
        }
        isOpen={isOpen}
        onClose={handleClose}
        position={{ top: position.top, left: position.left }}
        buttonRef={buttonRef}
        className={`w-72 ${modalHeight.modalClasses}`}
        containerClassName={`z-[70] ${modalHeight.modalContainerClasses}`}
      >
        <div className={`p-0 ${modalHeight.contentClasses}`}>
          {showSortView ? (
            <>
              {/* Sort options */}
              <button
                onClick={() => handleSortOption('newest')}
                className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <span>Newest first</span>
              </button>

              <button
                onClick={() => handleSortOption('oldest')}
                className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <span>Oldest first</span>
              </button>

              <button
                onClick={() => handleSortOption('alphabetical')}
                className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <span>Alphabetically</span>
              </button>
              {hasDueDateCards && (
                <button
                  onClick={() => handleSortOption('dueDate')}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <span>Due date</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Sort */}
              <button
                onClick={handleSort}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <IconSort className="h-4 w-4 text-gray-600" />
                <span>Sort</span>
              </button>

              {/* View archived cards */}
              <button
                onClick={handleViewArchivedCards}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <IconArchive className="h-4 w-4 text-gray-600" />
                <span>View archived cards</span>
              </button>

              {/* Archive all completed cards - only show if there are completed cards */}
              {hasCompletedCards && (
                <button
                  onClick={handleArchiveAllCompleted}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <IconArchive className="h-4 w-4 text-gray-600" />
                  <span>Archive all completed cards</span>
                </button>
              )}
            </>
          )}
        </div>
      </CardModal>

      {/* View Archived Modal */}
      <ViewArchivedModal isOpen={isViewArchivedModalOpen} onClose={handleCloseViewArchivedModal} />
    </>
  );
});

export { InboxMenuModal };
