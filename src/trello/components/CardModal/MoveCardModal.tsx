import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { IconSparkle } from '../icons/card-modal/icon-sparkle';
import { IconArrowRight } from '../icons/card-modal/icon-arrow-right';
import { IconArrowLeft } from '../icons/card-modal/icon-arrow-left';
import { IconDown } from '../icons/card-modal/icon-down';
import {
  CardModal,
  FlexContainer,
  IconButton,
  Text,
  ModalBackHeader,
  Dropdown,
  DropdownItem,
} from '../ui';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import {
  useCard,
  useList,
  useCardList,
  useVisibleLists,
  useListCards,
  useTrelloOperations,
  useBoards,
  useBoardLists,
  useMoveableBoardLists,
  useBoardListCards,
  useCardBoard,
} from '@trello/_lib/selectors';

type MoveCardModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  onBack?: () => void; // Go back to card action modal
};

const MoveCardModal: FC<MoveCardModalProps> = memo(function MoveCardModal({
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
  const { moveCard } = useTrelloOperations();
  const modalRef = useRef<HTMLDivElement>(null);
  const modalHeight = useDynamicModalHeight();

  // Get all available boards
  const allBoards = useBoards();

  const [selectedBoardId, setSelectedBoardId] = useState(
    currentBoard?.boardId ?? allBoards[0]?.id ?? 'basic-board'
  );
  const [selectedListId, setSelectedListId] = useState(currentList?.id ?? '');
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [selectedView, setSelectedView] = useState<'inbox' | 'board'>('board'); // Track which view is active

  // Use the modal positioning hook
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 288, // w-72 = 18rem = 288px
    fallbackHeight: 400,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Get lists for the selected board
  const selectedBoardLists = useBoardLists(selectedBoardId);
  const moveableBoardLists = useMoveableBoardLists(selectedBoardId);

  // Get cards in the selected list to determine available positions
  const selectedListCards = useBoardListCards(selectedBoardId, selectedListId);

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

  // Compute suggested lists - use moveable lists excluding current list
  const suggestedLists = useMemo(() => {
    if (!card) return [];
    return moveableBoardLists.filter((list) => list.id !== currentList?.id);
  }, [card, moveableBoardLists, currentList?.id]);

  // Reset state when modal opens or card changes
  useEffect(() => {
    if (card && isOpen && currentBoard) {
      setSelectedBoardId(currentBoard.boardId);
      setSelectedListId(currentList?.id ?? '');
      setSelectedPosition(currentPosition);
      setSelectedView('board'); // Reset to board view when modal opens
    }
  }, [card, isOpen, currentPosition, currentBoard, currentList?.id]);

  // Reset selected list when board changes
  useEffect(() => {
    if (selectedBoardLists.length > 0) {
      // Set to first non-inbox list if available, otherwise first list
      const firstNonInboxList = selectedBoardLists.find((list) => list.id !== 'inbox');
      setSelectedListId(firstNonInboxList?.id ?? selectedBoardLists[0]?.id ?? '');
      setSelectedPosition(1);
    }
  }, [selectedBoardId, selectedBoardLists]);

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

  // Calculate max positions
  const boardViewMaxPosition = useMemo(() => {
    if (selectedListId === currentList?.id) {
      return selectedListCards.length; // Same list
    }
    return selectedListCards.length + 1; // Different list
  }, [selectedListId, currentList?.id, selectedListCards.length]);

  const inboxViewMaxPosition = inboxCards.length === 0 ? 1 : inboxCards.length;

  // Generate position options arrays
  const boardPositionOptions = Array.from({ length: boardViewMaxPosition }, (_, i) => i + 1);
  const inboxPositionOptions = Array.from({ length: inboxViewMaxPosition }, (_, i) => i + 1);

  if (!card || !currentList) return null;

  const handleMove = () => {
    if (selectedView === 'inbox') {
      // Move to inbox
      moveCard({
        cardId: card.id,
        targetListId: 'inbox',
        targetIndex: selectedPosition - 1, // Convert to 0-based index
        targetBoardId: selectedBoardId, // Pass the selected board ID
      });
      onClose();
    } else {
      // Board view - ensure we're not using inbox
      const targetListId =
        selectedListId === 'inbox' ? (moveableBoardLists[0]?.id ?? selectedListId) : selectedListId;

      if (targetListId !== currentList?.id || selectedPosition !== currentPosition) {
        moveCard({
          cardId: card.id,
          targetListId,
          targetIndex: selectedPosition - 1, // Convert to 0-based index
          targetBoardId: selectedBoardId, // Pass the selected board ID
        });
        onClose();
      } else {
        // No changes needed, just close
        onClose();
      }
    }
  };

  const handleSuggestedMove = (listId: string) => {
    // Move the card immediately to the end of the selected list
    // We need to get the target list to know the position
    const targetList = selectedBoardLists.find((list) => list.id === listId);
    const targetListCardsCount = targetList?.cardRefs.length || 0;

    moveCard({
      cardId: card.id,
      targetListId: listId,
      targetIndex: targetListCardsCount, // Move to end
      targetBoardId: selectedBoardId, // Pass the selected board ID
    });
    onClose();
  };

  const getDirectionIcon = (targetListId: string) => {
    if (!card) return <IconArrowRight className="h-5 w-5 text-gray-500" />;

    const currentListIndex = visibleLists.findIndex((list) => list.id === currentList?.id);
    const targetListIndex = visibleLists.findIndex((list) => list.id === targetListId);

    // If target is to the left of current, show left arrow
    if (targetListIndex < currentListIndex) {
      return <IconArrowLeft className="h-5 w-5 text-gray-500" />;
    }

    // If target is to the right of current, show right arrow
    return <IconArrowRight className="h-5 w-5 text-gray-500" />;
  };

  return (
    <CardModal
      ref={modalRef}
      title="Move card"
      isOpen={isOpen}
      onClose={onBack || onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      dataAttribute="data-move-modal"
      showDivider={true}
      buttonRef={buttonRef}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
      customHeader={onBack ? <ModalBackHeader title="Move card" onBack={onBack} /> : undefined}
    >
      {/* Content */}
      <div className={`p-3 ${modalHeight.contentClasses}`}>
        {/* Suggested Section */}
        <div className="mb-4">
          <FlexContainer gap="2" className="mb-3">
            <button
              onClick={() => setSelectedView('inbox')}
              className={`flex-1 rounded-sm px-3 py-2 text-left text-sm font-medium transition-colors ${
                selectedView === 'inbox'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setSelectedView('board')}
              className={`flex-1 rounded-sm px-3 py-2 text-left text-sm font-medium transition-colors ${
                selectedView === 'board'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              Board
            </button>
          </FlexContainer>

          {/* Suggested Lists - Only show in board view */}
          {selectedView === 'board' && (
            <div className="mb-4">
              <FlexContainer align="center" gap="2" className="mb-2">
                <IconSparkle className="h-4 w-4 text-gray-500" />
                <Text variant="body" className="text-sm font-semibold text-gray-700">
                  Suggested
                </Text>
              </FlexContainer>
              <div className="space-y-1">
                {suggestedLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleSuggestedMove(list.id)}
                    className="flex w-full items-center gap-2 rounded-sm bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <span className="flex items-center">{getDirectionIcon(list.id)}</span>
                    <span>{list.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Select Destination */}
        <div className="space-y-4">
          {selectedView === 'board' ? (
            <>
              <Text variant="body" className="text-xs font-medium text-gray-600">
                Select destination
              </Text>

              {/* Board Selection */}
              <div>
                <label
                  htmlFor="board-select"
                  className="mb-1 block text-xs font-bold text-gray-600"
                >
                  Board
                </label>
                <Dropdown
                  trigger={
                    <div className="relative w-full">
                      <div className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-left text-sm text-gray-700">
                        {allBoards.find((board) => board.id === selectedBoardId)?.title ||
                          'Select board'}
                      </div>
                      <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  }
                  position="bottom-left"
                  contentClassName="[width:var(--trigger-width)]"
                  className="block w-full"
                  usePortal={true}
                >
                  {allBoards.map((board) => (
                    <DropdownItem
                      key={board.id}
                      onClick={() => setSelectedBoardId(board.id)}
                      className={selectedBoardId === board.id ? 'bg-blue-50 text-blue-600' : ''}
                    >
                      {board.title}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              {/* List and Position Selection */}
              <FlexContainer gap="2">
                {/* List Selection */}
                <div className="flex-[3]">
                  <label
                    htmlFor="list-select"
                    className="mb-1 block text-xs font-bold text-gray-600"
                  >
                    List
                  </label>
                  <Dropdown
                    trigger={
                      <div className="relative w-full">
                        <div className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-left text-sm text-gray-700">
                          {moveableBoardLists.find((list) => list.id === selectedListId)?.title ||
                            'Select list'}
                        </div>
                        <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    }
                    position="bottom-left"
                    contentClassName="[width:var(--trigger-width)]"
                    className="block w-full"
                    usePortal={true}
                  >
                    {moveableBoardLists.map((list) => (
                      <DropdownItem
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className={selectedListId === list.id ? 'bg-blue-50 text-blue-600' : ''}
                      >
                        {list.title}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                </div>

                {/* Position Selection */}
                <div className="flex-1">
                  <label
                    htmlFor="position-select"
                    className="mb-1 block text-xs font-bold text-gray-600"
                  >
                    Position
                  </label>
                  <Dropdown
                    trigger={
                      <div className="relative w-full">
                        <div className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-left text-sm text-gray-700">
                          {selectedPosition}
                        </div>
                        <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    }
                    position="bottom-left"
                    contentClassName="min-w-[var(--trigger-width)]"
                    className="block w-full"
                    usePortal={true}
                  >
                    {boardPositionOptions.map((position) => {
                      const isCurrentPosition =
                        position === currentPosition && selectedListId === currentList?.id;
                      return (
                        <DropdownItem
                          key={position}
                          onClick={() => setSelectedPosition(position)}
                          className={
                            selectedPosition === position ? 'bg-blue-50 text-blue-600' : ''
                          }
                        >
                          <div className="flex flex-col">
                            <span>{position}</span>
                            {isCurrentPosition && (
                              <span className="text-xs text-blue-600">(current)</span>
                            )}
                          </div>
                        </DropdownItem>
                      );
                    })}
                  </Dropdown>
                </div>
              </FlexContainer>
            </>
          ) : (
            <>
              {/* Inbox View - Simple Position Selector */}
              <FlexContainer justify="between" align="center">
                <Text variant="body" className="text-sm font-medium text-gray-700">
                  Select position
                </Text>
                <Dropdown
                  trigger={
                    <div className="relative">
                      <div className="appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-left text-sm text-gray-700">
                        {selectedPosition}
                      </div>
                      <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  }
                  position="bottom-left"
                  contentClassName="min-w-[var(--trigger-width)]"
                  usePortal={true}
                >
                  {inboxPositionOptions.map((position) => {
                    const isCurrentPosition =
                      position === currentPosition && currentList?.id === 'inbox';
                    return (
                      <DropdownItem
                        key={position}
                        onClick={() => setSelectedPosition(position)}
                        className={selectedPosition === position ? 'bg-blue-50 text-blue-600' : ''}
                      >
                        <div className="flex flex-col">
                          <span>{position}</span>
                          {isCurrentPosition && (
                            <span className="text-xs text-blue-600">(current)</span>
                          )}
                        </div>
                      </DropdownItem>
                    );
                  })}
                </Dropdown>
              </FlexContainer>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className={modalHeight.footerClasses}>
        <div className="p-3 pt-0">
          {/* Move Button */}
          <div className="mt-4">
            <button
              onClick={handleMove}
              className="w-1/4 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              Move
            </button>
          </div>
        </div>
      </div>
    </CardModal>
  );
});

export { MoveCardModal };
