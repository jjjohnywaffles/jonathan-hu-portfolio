import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { IconDown } from '../icons/card-modal/icon-down';
import {
  CardModal,
  Button,
  ActionButton,
  Text,
  IconButton,
  FlexContainer,
  ModalBackHeader,
} from '../ui';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { cn } from '@trello/_lib/shims/utils';
import {
  useCard,
  useList,
  useCardList,
  useVisibleLists,
  useListCards,
  useBoards,
  useBoardLists,
  useMoveableBoardLists,
  useCardBoard,
  useTrelloOperations,
} from '@trello/_lib/selectors';

type MirrorCardModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  onBack?: () => void;
};

const MirrorCardModal: FC<MirrorCardModalProps> = memo(function MirrorCardModal({
  cardId,
  isOpen,
  onClose,
  buttonRef,
  onBack,
}) {
  const card = useCard(cardId);
  const currentList = useCardList(cardId);
  const currentBoard = useCardBoard(cardId);
  const visibleLists = useVisibleLists();
  const { mirrorCard } = useTrelloOperations();
  const modalRef = useRef<HTMLDivElement>(null);

  // Get all available boards
  const allBoards = useBoards();

  const [selectedBoardId, setSelectedBoardId] = useState(
    currentBoard?.boardId ?? allBoards[0]?.id ?? 'basic-board'
  );
  const [selectedListId, setSelectedListId] = useState(currentList?.id ?? '');
  const [selectedPosition, setSelectedPosition] = useState(1);
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 400,
    fallbackWidth: 300,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });
  const modalHeight = useDynamicModalHeight();
  const [selectedView, setSelectedView] = useState<'inbox' | 'board'>('board'); // Track which view is active

  // Shared class constants for deduplication
  const selectClasses =
    'w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';
  const dropdownArrowClasses =
    'pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400';
  const labelClasses = 'mb-1 block text-xs font-medium text-gray-600';
  const viewButtonClasses = 'flex-1 text-left';

  // Get lists for the selected board
  const selectedBoardLists = useBoardLists(selectedBoardId);

  // Get available lists (exclude inbox and archived lists)
  const availableLists = useMoveableBoardLists(selectedBoardId);

  // Get cards in the selected list to determine available positions
  const selectedListCards = useListCards(selectedListId);

  // Get current list cards for position calculation
  const currentListCards = useListCards(currentList?.id ?? '');

  // Get inbox cards for position calculation
  const inboxCards = useListCards('inbox');

  // Compute current position
  const currentPosition = useMemo(() => {
    if (!card) return 1;
    const currentIndex = currentListCards.findIndex((c) => c.id === card.id);
    return currentIndex + 1;
  }, [card, currentListCards]);

  // Reset selected list when board changes
  useEffect(() => {
    if (availableLists.length > 0) {
      setSelectedListId(availableLists[0]?.id ?? '');
      setSelectedPosition(1);
    }
  }, [selectedBoardId, availableLists]);

  // Reset state when modal opens or card changes
  useEffect(() => {
    if (card && isOpen && currentBoard) {
      setSelectedBoardId(currentBoard.boardId);
      setSelectedListId(currentList?.id ?? '');
      setSelectedPosition(currentPosition);
      setSelectedView('board'); // Reset to board view when modal opens
    }
  }, [card, isOpen, currentPosition, currentBoard, currentList?.id]);

  // Update selected position when list changes (but not when modal first opens)
  useEffect(() => {
    if (card && selectedListId && selectedListId !== currentList?.id) {
      // Different list - default to end
      setSelectedPosition(selectedListCards.length + 1);
    }
  }, [selectedListId, card, selectedListCards.length, currentList?.id]);

  // Click outside handling is now managed by CardModal

  // Reset modal state when it closes to ensure fresh state next time
  useEffect(() => {
    if (!isOpen && card && currentBoard) {
      // Reset to current card state when modal closes
      setSelectedBoardId(currentBoard.boardId);
      setSelectedListId(currentList?.id ?? '');
      setSelectedPosition(currentPosition);
      setSelectedView('board');
    }
  }, [isOpen, card, currentPosition, currentBoard, currentList?.id]);

  // Reset position when switching views
  useEffect(() => {
    if (selectedView === 'inbox') {
      // Inbox positions should be limited to existing count (min 1 when empty)
      const maxPos = inboxCards.length === 0 ? 1 : inboxCards.length;
      setSelectedPosition(maxPos);
    } else if (card) {
      setSelectedPosition(currentPosition); // Reset to current position for board view
    }
  }, [selectedView, inboxCards.length, currentPosition, card]);

  if (!card || !currentList) return null;

  const handleMirror = () => {
    if (selectedView === 'inbox') {
      // Mirror to inbox
      mirrorCard({
        sourceCardId: card.id,
        targetListId: 'inbox',
        targetIndex: selectedPosition - 1, // Convert to 0-based index
      });
      onClose();
    } else {
      // Board view - ensure we're not using inbox
      const targetListId =
        selectedListId === 'inbox' ? (availableLists[0]?.id ?? selectedListId) : selectedListId;

      mirrorCard({
        sourceCardId: card.id,
        targetListId,
        targetIndex: selectedPosition - 1, // Convert to 0-based index
      });
      onClose();
    }
  };

  const generatePositionOptions = () => {
    const options = [];
    let maxPosition;

    if (selectedView === 'inbox') {
      // Inbox view - positions limited to existing count (min 1 when empty)
      maxPosition = inboxCards.length === 0 ? 1 : inboxCards.length;
    } else if (selectedListId === currentList?.id) {
      // Same list - can mirror to any position including current
      maxPosition = selectedListCards.length + 1; // +1 to allow adding at end
    } else {
      // Different list - can mirror to any position + end
      maxPosition = selectedListCards.length + 1;
    }

    for (let i = 1; i <= maxPosition; i++) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }

    return options;
  };

  return (
    <CardModal
      ref={modalRef}
      title="Mirror card"
      isOpen={isOpen}
      onClose={onBack || onClose}
      position={modalPosition}
      dataAttribute="data-mirror-modal"
      showDivider={true}
      buttonRef={buttonRef}
      customHeader={onBack ? <ModalBackHeader title="Mirror card" onBack={onBack} /> : undefined}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
    >
      {/* Content */}
      <div className={`p-3 ${modalHeight.contentClasses}`}>
        {/* View Selection */}
        <div className="mb-4">
          <FlexContainer gap="2" className="mb-3">
            <Button
              onClick={() => setSelectedView('inbox')}
              variant="secondary"
              className={cn(
                viewButtonClasses,
                selectedView === 'inbox' && 'bg-gray-200 text-gray-800'
              )}
            >
              Inbox
            </Button>
            <Button
              onClick={() => setSelectedView('board')}
              variant="secondary"
              className={cn(
                viewButtonClasses,
                selectedView === 'board' && 'bg-gray-200 text-gray-800'
              )}
            >
              Board
            </Button>
          </FlexContainer>
        </div>

        {/* Select Destination */}
        <div className="space-y-4">
          {selectedView === 'board' ? (
            <>
              <h3 className="text-sm font-semibold text-gray-800">Select destination</h3>

              {/* Board Selection */}
              <div>
                <Text className={labelClasses}>Board</Text>
                <div className="relative">
                  <select
                    id="board-select"
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className={selectClasses}
                  >
                    {allBoards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.title}
                      </option>
                    ))}
                  </select>
                  <IconDown className={dropdownArrowClasses} />
                </div>
              </div>

              {/* List and Position Selection */}
              <div className="flex gap-2">
                {/* List Selection */}
                <div className="flex-[3]">
                  <label htmlFor="list-select" className={labelClasses}>
                    List
                  </label>
                  <div className="relative">
                    <select
                      id="list-select"
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className={selectClasses}
                    >
                      {availableLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title}
                        </option>
                      ))}
                    </select>
                    <IconDown className={dropdownArrowClasses} />
                  </div>
                </div>

                {/* Position Selection */}
                <div className="flex-1">
                  <label htmlFor="position-select" className={labelClasses}>
                    Position
                  </label>
                  <div className="relative">
                    <select
                      id="position-select"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(Number(e.target.value))}
                      className={selectClasses}
                    >
                      {generatePositionOptions()}
                    </select>
                    <IconDown className={dropdownArrowClasses} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Inbox View - Simple Position Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Select position</span>
                <div className="relative">
                  <select
                    id="inbox-position-select"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(Number(e.target.value))}
                    className={selectClasses}
                  >
                    {generatePositionOptions()}
                  </select>
                  <IconDown className={dropdownArrowClasses} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className={modalHeight.footerClasses}>
        <div className="p-3 pt-0">
          {/* Mirror Button */}
          <div className="mt-4">
            <ActionButton onClick={handleMirror} variant="primary">
              Mirror
            </ActionButton>
          </div>
        </div>
      </div>
    </CardModal>
  );
});

export { MirrorCardModal };
