import React, { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { IconClose } from '../icons/card-modal/icon-close';
import { IconChevronLeft } from '../icons/board/icon-chevron-left';
import { IconChevronDown } from '../icons/board/icon-chevron-down';
import { IconCheckmark } from '../icons/list/icon-checkmark';
import { useModalClickOutside } from '../../hooks/use-modal-click-outside';
import { useDynamicModalHeight } from '../../hooks/use-dynamic-modal-height';
import { PopoverModal, MenuButton, IconButton, Text, Dropdown, DropdownItem } from '../ui';
import { useNotifications } from '../NotificationContext';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import {
  useList,
  useListCards,
  useTrelloOperations,
  useVisibleLists,
  useIsListWatched,
  useBoardLists,
} from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';
import type { Board, List } from '@trello/_lib/types';

type ListActionProps = {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  actionButtonRef: React.RefObject<HTMLButtonElement | null>;
  onStartTopCardCreation: () => void;
};

const ListAction: FC<ListActionProps> = memo(function ListAction({
  listId,
  isOpen,
  onClose,
  actionButtonRef,
  onStartTopCardCreation,
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const copyTitleInputRef = useRef<HTMLTextAreaElement>(null);

  // Consolidated modal state
  type ModalState = {
    activeModal:
      | 'main'
      | 'copyList'
      | 'moveList'
      | 'moveAllCards'
      | 'sortList'
      | 'confirmArchiveAllCards';
    copyListTitle: string;
    selectedBoardId: string;
    selectedPosition: number;
    isColorSectionExpanded: boolean;
    isAutomationSectionExpanded: boolean;
  };

  const [modalState, setModalState] = useState<ModalState>({
    activeModal: 'main',
    copyListTitle: '',
    selectedBoardId: '',
    selectedPosition: 1,
    isColorSectionExpanded: true,
    isAutomationSectionExpanded: true,
  });

  // Helper function to update modal state
  const updateModalState = useCallback((updates: Partial<ModalState>) => {
    setModalState((prev) => ({ ...prev, ...updates }));
  }, []);

  const list = useList(listId);
  const cards = useListCards(listId);
  const hasCardsWithDueDate = useMemo(
    () => cards.some((card) => (card?.dueDate?.trim() ?? '').length > 0),
    [cards]
  );
  const {
    copyList,
    moveList,
    moveAllCardsToList,
    sortList,
    toggleListWatch,
    archiveList,
    unarchiveList,
    archiveAllCardsInList,
    unarchiveAllCardsInList,
  } = useTrelloOperations();
  const { showNotification } = useNotifications();
  const isListWatched = useIsListWatched(listId);
  const currentBoardVisibleLists = useVisibleLists();

  // Get all boards and current board info
  const { boards, currentBoardId } = useTrelloStore(
    useShallow((state) => ({
      boards: state.boards,
      currentBoardId: state.currentBoardId,
    }))
  );

  const currentBoard = boards[currentBoardId];
  const allBoardsList = useMemo(() => Object.values(boards) as Board[], [boards]);
  const modalHeight = useDynamicModalHeight();

  // We can't use hooks inside callbacks, so we'll need to get lists differently
  const currentBoardLists = useBoardLists(currentBoardId);

  // For the selected board in modal, get its lists when needed
  const selectedBoardLists = useBoardLists(modalState.selectedBoardId || currentBoardId);

  // Helper function to filter visible lists (exclude inbox, archived, and non-draggable)
  const getVisibleLists = useCallback((lists: List[]) => {
    return lists.filter(
      (list: List) => list.id !== 'inbox' && list.isDraggable !== false && !list.archived
    );
  }, []);

  // Use modal position hook
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: actionButtonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 250,
    fallbackHeight: 200,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use the modal click outside hook
  useModalClickOutside({
    isOpen,
    onClose,
    modalRef,
    buttonRef: actionButtonRef,
  });

  // Focus and select text when copy modal opens
  useEffect(() => {
    if (modalState.activeModal === 'copyList' && copyTitleInputRef.current) {
      copyTitleInputRef.current.focus();
      copyTitleInputRef.current.select();
    }
  }, [modalState.activeModal]);

  // Update positions when board changes in move modal
  useEffect(() => {
    if (
      modalState.activeModal === 'moveList' &&
      modalState.selectedBoardId &&
      boards[modalState.selectedBoardId]
    ) {
      // Reset to position 1 when changing boards
      if (modalState.selectedBoardId !== currentBoardId) {
        updateModalState({
          selectedPosition: 1,
        });
      }
    }
  }, [
    modalState.selectedBoardId,
    modalState.activeModal,
    currentBoardId,
    boards,
    updateModalState,
  ]);

  if (!isOpen || !list) return null;

  const handleAddCard = () => {
    onStartTopCardCreation();
  };

  const handleCopyListClick = () => {
    updateModalState({
      activeModal: 'copyList',
      copyListTitle: list.title,
    });
  };

  const handleCopyListBack = () => {
    updateModalState({
      activeModal: 'main',
      copyListTitle: '',
    });
  };

  const handleCopyListSubmit = () => {
    if (modalState.copyListTitle.trim()) {
      copyList({ listId, title: modalState.copyListTitle.trim() });
      updateModalState({
        activeModal: 'main',
        copyListTitle: '',
      });
      onClose(); // Close the entire modal
    }
  };

  const handleMoveListClick = () => {
    // Initialize with current board and find current position using visible lists
    const currentPosition = currentBoardVisibleLists.findIndex((l) => l.id === listId);
    updateModalState({
      activeModal: 'moveList',
      selectedBoardId: currentBoardId,
      selectedPosition: currentPosition >= 0 ? currentPosition + 1 : 1, // Position is 1-indexed
    });
  };

  const handleMoveListBack = () => {
    updateModalState({
      activeModal: 'main',
      selectedBoardId: '',
      selectedPosition: 1,
    });
  };

  const handleMoveListSubmit = () => {
    moveList({
      listId,
      targetBoardId: modalState.selectedBoardId,
      targetPosition: modalState.selectedPosition,
    });
    updateModalState({ activeModal: 'main' });
    onClose(); // Close the entire modal
  };

  // Helper functions for custom dropdowns
  const handleBoardSelect = (boardId: string) => {
    updateModalState({
      selectedBoardId: boardId,
    });
  };

  const handlePositionSelect = (position: number) => {
    updateModalState({
      selectedPosition: position,
    });
  };

  // Get selected board display name
  const getSelectedBoardDisplay = () => {
    const board = boards[modalState.selectedBoardId];
    return board ? board.title : 'Select board';
  };

  // Check if board is current
  const isBoardCurrent = (boardId: string) => boardId === currentBoardId;

  // Move all cards handlers
  const handleMoveAllCardsClick = () => {
    updateModalState({ activeModal: 'moveAllCards' });
  };

  const handleMoveAllCardsBack = () => {
    updateModalState({ activeModal: 'main' });
  };

  const handleMoveAllCardsToList = (targetListId: string) => {
    moveAllCardsToList({ sourceListId: listId, targetListId });
    // Build success notification message
    const sourceTitle = list?.title ?? 'this list';
    const targetList = currentBoardLists.find((l) => l.id === targetListId);
    const targetTitle = targetList?.title ?? 'the target list';
    showNotification({
      type: 'success',
      message: `All cards in list ${sourceTitle} have been moved to list ${targetTitle}`,
      duration: 5000,
    });
    updateModalState({ activeModal: 'main' });
    onClose(); // Close the entire modal
  };

  // Sort list handlers
  const handleSortListClick = () => {
    if (cards.length === 0) {
      return;
    }
    updateModalState({ activeModal: 'sortList' });
  };

  const handleSortListBack = () => {
    updateModalState({ activeModal: 'main' });
  };

  const handleSortList = (
    sortBy: 'dateCreatedNewest' | 'dateCreatedOldest' | 'cardNameAlphabetical' | 'dueDate'
  ) => {
    sortList({ listId, sortBy });
    updateModalState({ activeModal: 'main' });
    onClose(); // Close the entire modal
  };

  // Watch list handler
  const handleToggleListWatch = () => {
    toggleListWatch({ listId });
  };

  // Archive list handler
  const handleArchiveList = () => {
    archiveList({ listId });
    onClose(); // Close the modal after archiving

    // Show archive notification with undo option
    showNotification({
      type: 'archive',
      message: 'List archived',
      onUndo: () => {
        unarchiveList({ listId });
        // Show unarchived notification
        showNotification({
          type: 'unarchive',
          message: 'Unarchived list',
          duration: 3000,
        });
      },
    });
  };

  // Archive all cards handlers
  const handleArchiveAllCardsClick = () => {
    updateModalState({ activeModal: 'confirmArchiveAllCards' });
  };

  const handleArchiveAllCardsBack = () => {
    updateModalState({ activeModal: 'main' });
  };

  const handleConfirmArchiveAllCards = () => {
    const archivedCardIds = archiveAllCardsInList({ listId });
    updateModalState({ activeModal: 'main' });
    onClose(); // Close the list action modal after archiving

    if (archivedCardIds.length > 0) {
      // Show archive notification without undo option cuz why would we give people the option to undo
      const listTitle = list?.title ?? 'this list';
      showNotification({
        type: 'success',
        message: `All cards in the list ${listTitle} have been archived.`,
        duration: 5000,
      });
    }
  };

  const colors = [
    { name: 'green', bg: 'bg-green-500' },
    { name: 'yellow', bg: 'bg-yellow-400' },
    { name: 'orange', bg: 'bg-orange-500' },
    { name: 'red', bg: 'bg-red-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'teal', bg: 'bg-teal-500' },
    { name: 'lime', bg: 'bg-lime-500' },
    { name: 'magenta', bg: 'bg-pink-500' },
    { name: 'gray', bg: 'bg-gray-500' },
  ];

  // Helper to get the appropriate back handler for the current modal
  const getBackHandler = () => {
    switch (modalState.activeModal) {
      case 'copyList':
        return handleCopyListBack;
      case 'moveList':
        return handleMoveListBack;
      case 'moveAllCards':
        return handleMoveAllCardsBack;
      case 'confirmArchiveAllCards':
        return handleArchiveAllCardsBack;
      case 'sortList':
        return handleSortListBack;
      default:
        return onClose;
    }
  };

  return (
    <>
      <PopoverModal
        isOpen={isOpen}
        position={modalPosition}
        ref={modalRef}
        className={`w-72 ${modalHeight.modalClasses}`}
        data-testid="list-action-modal"
        containerClassName={`${modalHeight.modalContainerClasses}`}
      >
        {/* Header */}
        <header className="relative flex items-center justify-center p-3">
          {modalState.activeModal !== 'main' && (
            <IconButton
              onClick={getBackHandler()}
              variant="ghost"
              size="sm"
              className="absolute left-3"
              aria-label="Back to list actions"
            >
              <IconChevronLeft className="h-4 w-4" />
            </IconButton>
          )}
          <Text variant="body" className="text-sm font-medium text-gray-700" id="list-actions-menu">
            {
              {
                main: 'List actions',
                copyList: 'Copy list',
                moveList: 'Move list',
                moveAllCards: 'Move all cards in list',
                sortList: 'Sort list',
                confirmArchiveAllCards: 'Are you sure?',
              }[modalState.activeModal]
            }
          </Text>
          <IconButton
            onClick={modalState.activeModal === 'main' ? onClose : getBackHandler()}
            variant="ghost"
            size="sm"
            className="absolute right-3 h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            aria-label="Close popover"
          >
            <IconClose className="h-4 w-4" />
          </IconButton>
        </header>

        {/* Content */}
        <div className={modalHeight.contentClasses}>
          {modalState.activeModal === 'copyList' ? (
            /* Copy List Form */
            <div className="p-3">
              <div className="mb-3">
                <label
                  htmlFor="copy-list-title"
                  className="mb-2 block text-xs font-medium text-gray-700"
                >
                  Name
                </label>
                <textarea
                  ref={copyTitleInputRef}
                  id="copy-list-title"
                  value={modalState.copyListTitle}
                  onChange={(e) => updateModalState({ copyListTitle: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && modalState.copyListTitle.trim()) {
                      e.preventDefault();
                      handleCopyListSubmit();
                    } else if (e.key === 'Escape') {
                      handleCopyListBack();
                    }
                  }}
                  className="h-16 w-full resize-none rounded border border-gray-300 p-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <button
                onClick={handleCopyListSubmit}
                disabled={!modalState.copyListTitle.trim()}
                className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Create list
              </button>
            </div>
          ) : modalState.activeModal === 'moveAllCards' ? (
            /* Move All Cards Form */
            <div className="p-3">
              <div className="space-y-1">
                {currentBoardVisibleLists.map((targetList) => {
                  const isCurrentList = targetList.id === listId;

                  if (isCurrentList) {
                    // Display current list as grayed out and uninteractable
                    return (
                      <div
                        key={targetList.id}
                        className="w-full cursor-not-allowed rounded px-3 py-2 text-left text-sm"
                      >
                        <span className="text-gray-400">{targetList.title}</span>
                      </div>
                    );
                  } else {
                    // Display other lists as clickable buttons
                    return (
                      <button
                        key={targetList.id}
                        type="button"
                        onClick={() => handleMoveAllCardsToList(targetList.id)}
                        className="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        <span className="text-gray-900">{targetList.title}</span>
                      </button>
                    );
                  }
                })}
              </div>
            </div>
          ) : modalState.activeModal === 'sortList' ? (
            /* Sort List Form */
            <div className="p-3">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleSortList('dateCreatedNewest')}
                  className="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <span className="text-gray-900">Date created (newest first)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSortList('dateCreatedOldest')}
                  className="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <span className="text-gray-900">Date created (oldest first)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSortList('cardNameAlphabetical')}
                  className="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <span className="text-gray-900">Card name (alphabetically)</span>
                </button>
                {hasCardsWithDueDate && (
                  <button
                    type="button"
                    onClick={() => handleSortList('dueDate')}
                    className="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <span className="text-gray-900">Due date</span>
                  </button>
                )}
              </div>
            </div>
          ) : modalState.activeModal === 'moveList' ? (
            /* Move List Form */
            <div className="p-3">
              {/* Board Selection */}
              <div className="mb-3">
                <label className="mb-2 block text-xs font-medium text-gray-700">Board</label>
                <Dropdown
                  trigger={
                    <div className="flex w-full items-center justify-between rounded border border-gray-300 bg-white p-2 text-left text-sm hover:bg-gray-50 focus:border-transparent focus:ring-2 focus:ring-blue-500">
                      <span>{getSelectedBoardDisplay()}</span>
                      <IconChevronDown className="h-4 w-4" />
                    </div>
                  }
                  position="bottom-left"
                  className="block w-full"
                  usePortal={true}
                  useDynamicPositioning={true}
                >
                  {allBoardsList.map((board) => (
                    <DropdownItem key={board.id} onClick={() => handleBoardSelect(board.id)}>
                      <div className="flex flex-col">
                        <span className="text-gray-900">{board.title}</span>
                        {isBoardCurrent(board.id) && (
                          <span className="mt-0.5 text-xs text-gray-500">(current)</span>
                        )}
                      </div>
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              {/* Position Selection */}
              <div className="mb-3">
                <label className="mb-2 block text-xs font-medium text-gray-700">Position</label>
                <Dropdown
                  trigger={
                    <div className="flex w-full items-center justify-between rounded border border-gray-300 bg-white p-2 text-left text-sm hover:bg-gray-50 focus:border-transparent focus:ring-2 focus:ring-blue-500">
                      <span>{modalState.selectedPosition}</span>
                      <IconChevronDown className="h-4 w-4" />
                    </div>
                  }
                  position="bottom-left"
                  className="block w-full"
                  usePortal={true}
                  useDynamicPositioning={true}
                >
                  {(() => {
                    const isTargetCurrentBoard = modalState.selectedBoardId === currentBoardId;
                    const targetVisibleLists = getVisibleLists(selectedBoardLists);
                    const currentListPosition = isTargetCurrentBoard
                      ? currentBoardVisibleLists.findIndex((l) => l.id === listId) + 1
                      : -1;
                    const maxPositions = isTargetCurrentBoard
                      ? targetVisibleLists.length
                      : targetVisibleLists.length + 1;
                    const items = [] as React.ReactNode[];
                    for (let i = 1; i <= maxPositions; i++) {
                      const isCurrentPosition = isTargetCurrentBoard && i === currentListPosition;
                      items.push(
                        <DropdownItem key={i} onClick={() => handlePositionSelect(i)}>
                          <div className="flex flex-col">
                            <span className="text-gray-900">{i}</span>
                            {isCurrentPosition && (
                              <span className="mt-0.5 text-xs text-gray-500">(current)</span>
                            )}
                          </div>
                        </DropdownItem>
                      );
                    }
                    return items;
                  })()}
                </Dropdown>
              </div>

              <button
                onClick={handleMoveListSubmit}
                className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Move
              </button>
            </div>
          ) : modalState.activeModal === 'confirmArchiveAllCards' ? (
            /* Archive All Cards Confirmation */
            <div className="p-3">
              <p className="mb-4 text-sm text-gray-700">All cards in this list will be archived</p>
              <button
                onClick={handleConfirmArchiveAllCards}
                className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Archive cards
              </button>
            </div>
          ) : (
            <>
              {/* Main Actions */}
              <div className="p-1">
                <ul className="space-y-0">
                  <li>
                    <MenuButton onClick={handleAddCard} data-testid="list-actions-add-card-button">
                      Add card
                    </MenuButton>
                  </li>
                  <li>
                    <MenuButton
                      onClick={handleCopyListClick}
                      data-testid="list-actions-copy-list-button"
                    >
                      Copy list
                    </MenuButton>
                  </li>
                  <li>
                    <MenuButton
                      onClick={handleMoveListClick}
                      data-testid="list-actions-move-list-button"
                    >
                      Move list
                    </MenuButton>
                  </li>
                  {cards.length > 0 && (
                    <li>
                      <MenuButton
                        onClick={handleMoveAllCardsClick}
                        data-testid="list-actions-move-all-cards-button"
                      >
                        Move all cards in this list
                      </MenuButton>
                    </li>
                  )}
                  {cards.length > 0 && (
                    <li>
                      <MenuButton onClick={handleSortListClick}>Sort by…</MenuButton>
                    </li>
                  )}
                  <li>
                    <MenuButton
                      onClick={handleToggleListWatch}
                      data-testid="list-actions-watch-list-button"
                      aria-pressed={isListWatched ? 'true' : 'false'}
                      className="flex items-center justify-between"
                    >
                      <span>Watch</span>
                      {isListWatched && <IconCheckmark className="h-4 w-4 text-gray-800" />}
                    </MenuButton>
                  </li>
                </ul>
              </div>

              {/* Change List Color Section */}
              {/* Hidden: Color feature not implemented
        {false && (
        <section className="p-1">
          <h3>
            <FlexContainer
              justify="between"
              className="px-3 py-1.5 text-sm text-gray-700"
            >
              <FlexContainer gap="2">
                <span>Change list color</span>
                <span className="rounded-sm border border-blue-600 px-2 py-1 text-xs font-medium text-blue-600">
                  PREMIUM
                </span>
              </FlexContainer>
              <button
                onClick={() =>
                  setIsColorSectionExpanded(!isColorSectionExpanded)
                }
                aria-expanded={isColorSectionExpanded}
                className="p-1"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${
                    isColorSectionExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </FlexContainer>
          </h3>
          {isColorSectionExpanded && (
            <div className="mt-2 px-3">
              <div className="mb-3 grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    className={`h-6 w-10 rounded ${color.bg} border-2 hover:opacity-80 ${
                      color.name === "gray"
                        ? "border-gray-400"
                        : "border-transparent"
                    }`}
                    aria-label={color.name}
                    aria-checked={color.name === "gray"}
                    data-testid={`color-tile-${color.name}`}
                  />
                ))}
              </div>
              <button
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-400"
              >
                <IconClose />
                Remove color
              </button>
            </div>
          )}
        </section>
        )}
        */}

              {/* Divider */}
              {/* Hidden: Divider only needed between sections
        <div className="mx-2 border-t border-gray-200"></div>
        */}

              {/* Automation Section */}
              {/* Hidden: Automation features not implemented
        <section className="p-1">
          <h3>
            <FlexContainer
              justify="between"
              className="px-3 py-1.5 text-sm text-gray-700"
            >
              <Text variant="caption" className="text-xs">
                Automation
              </Text>
              <button
                onClick={() =>
                  setIsAutomationSectionExpanded(!isAutomationSectionExpanded)
                }
                aria-expanded={isAutomationSectionExpanded}
                className="p-1"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${
                    isAutomationSectionExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </FlexContainer>
          </h3>
          {isAutomationSectionExpanded && (
            <div className="mt-1">
              <ul className="space-y-0">
                <li>
                  <MenuButton>When a card is added to the list…</MenuButton>
                </li>
                <li>
                  <MenuButton>Every day, sort list by…</MenuButton>
                </li>
                <li>
                  <MenuButton>Every Monday, sort list by…</MenuButton>
                </li>
                <li>
                  <a
                    className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                    href="#"
                    tabIndex={0}
                  >
                    Create a rule
                  </a>
                </li>
              </ul>
            </div>
          )}
        </section>
        */}

              {/* Archive Section */}
              <div className="p-1">
                <ul className="space-y-0">
                  <li className="my-2 border-t border-gray-200"></li>
                  <li>
                    <MenuButton
                      onClick={handleArchiveList}
                      data-testid="list-actions-archive-list-button"
                    >
                      Archive this list
                    </MenuButton>
                  </li>
                  {cards.length > 0 && (
                    <li>
                      <MenuButton
                        onClick={handleArchiveAllCardsClick}
                        data-testid="list-actions-archive-all-cards-button"
                      >
                        Archive all cards in this list
                      </MenuButton>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </PopoverModal>
    </>
  );
});

export { ListAction };
