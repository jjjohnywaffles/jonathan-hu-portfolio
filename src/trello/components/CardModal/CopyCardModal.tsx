import React, { memo, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { IconDown } from '../icons/card-modal/icon-down';
import {
  CardModal,
  Button,
  Input,
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
  useCardList,
  useVisibleLists,
  useListCards,
  useTrelloOperations,
  useCardComments,
  useBoards,
  useBoardLists,
  useMoveableBoardLists,
} from '@trello/_lib/selectors';

type CopyCardModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  onBack?: () => void;
};

type KeepOption = {
  key: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const CopyCardModal: FC<CopyCardModalProps> = memo(function CopyCardModal({
  cardId,
  isOpen,
  onClose,
  buttonRef,
  onBack,
}) {
  const card = useCard(cardId);
  const currentList = useCardList(cardId);
  const visibleLists = useVisibleLists();
  const { copyCard } = useTrelloOperations();
  const modalRef = useRef<HTMLDivElement>(null);
  const comments = useCardComments(cardId);
  const modalHeight = useDynamicModalHeight();

  // Get all available boards
  const allBoards = useBoards();

  const [selectedBoardId, setSelectedBoardId] = useState(allBoards[0]?.id ?? 'basic-board');
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
  const [selectedView, setSelectedView] = useState<'inbox' | 'board'>('board'); // Track which view is active
  const [cardTitle, setCardTitle] = useState(card?.title ?? '');
  const [keepLabels, setKeepLabels] = useState(true);
  const [keepComments, setKeepComments] = useState(true);
  const [keepMembers, setKeepMembers] = useState(true);
  const [keepChecklists, setKeepChecklists] = useState(true);
  const [keepCustomFields, setKeepCustomFields] = useState(true);

  // Get lists for the selected board
  const selectedBoardLists = useBoardLists(selectedBoardId);
  const moveableBoardLists = useMoveableBoardLists(selectedBoardId);

  // Get cards in the selected list to determine available positions
  const selectedListCards = useListCards(selectedListId);

  // Get inbox cards for position calculation
  const inboxCards = useListCards('inbox');

  // Set initial card title when card changes
  useEffect(() => {
    if (card) {
      setCardTitle(card.title);
    }
  }, [card]);

  // Reset selected list when board changes or lists update,
  // but only if the current selection isn't valid for this board.
  // Critically: use the moveable lists (exclude archived/inbox) to avoid selecting archived lists.
  useEffect(() => {
    if (moveableBoardLists.length === 0) {
      return;
    }
    const stillValid = moveableBoardLists.some((l) => l.id === selectedListId);
    if (!stillValid) {
      setSelectedListId(moveableBoardLists[0]?.id ?? '');
      setSelectedPosition(1);
    }
  }, [selectedBoardId, moveableBoardLists, selectedListId]);

  // Click outside handling is now managed by CardModal

  // Reset modal state when it closes to ensure fresh state next time
  useEffect(() => {
    if (!isOpen && card && currentList) {
      // Reset to current card state when modal closes
      setSelectedListId(currentList.id);
      setSelectedPosition(1);
      setSelectedView('board');

      setCardTitle(card.title);
      setKeepLabels(true);
      setKeepComments(true);
      setKeepMembers(true);
      setKeepChecklists(true);
      setKeepCustomFields(true);
    }
  }, [isOpen, card, currentList]);

  // Reset position when switching views
  useEffect(() => {
    if (selectedView === 'inbox') {
      // Limit to existing count (min 1 when empty)
      const maxPos = inboxCards.length === 0 ? 1 : inboxCards.length;
      setSelectedPosition(maxPos);
    } else {
      setSelectedPosition(1); // Default to position 1 for board view
    }
  }, [selectedView, inboxCards.length]);

  if (!card || !currentList) return null;

  const labelCount = card.labelIds?.length ?? 0;
  const commentCount = comments.length;
  const memberCount = card.assignedTo?.length ?? 0;
  const checklistCount = card.checklistIds?.length ?? 0;
  const activeCustomFields = card.customFields ?? card.preservedCustomFields ?? [];
  const customFieldValueCount = activeCustomFields.filter(
    (field) => field.value != null && field.value !== ''
  ).length;

  const hasLabels = labelCount > 0;
  const hasComments = commentCount > 0;
  const hasMembers = memberCount > 0;
  const hasChecklists = checklistCount > 0;
  const hasCustomFieldValues = customFieldValueCount > 0;

  const keepOptions: KeepOption[] = [];
  if (hasLabels) {
    keepOptions.push({
      key: 'labels',
      label: `Labels (${labelCount})`,
      checked: keepLabels,
      onChange: setKeepLabels,
    });
  }
  if (hasComments) {
    keepOptions.push({
      key: 'comments',
      label: `Comments (${commentCount})`,
      checked: keepComments,
      onChange: setKeepComments,
    });
  }
  if (hasMembers) {
    keepOptions.push({
      key: 'members',
      label: `Members (${memberCount})`,
      checked: keepMembers,
      onChange: setKeepMembers,
    });
  }
  if (hasChecklists) {
    keepOptions.push({
      key: 'checklists',
      label: `Checklists (${checklistCount})`,
      checked: keepChecklists,
      onChange: setKeepChecklists,
    });
  }
  if (hasCustomFieldValues) {
    keepOptions.push({
      key: 'customFields',
      label: `Custom fields (${customFieldValueCount})`,
      checked: keepCustomFields,
      onChange: setKeepCustomFields,
    });
  }

  const shouldShowKeepSection = keepOptions.length > 0;

  const handleCopy = () => {
    let targetListId: string;
    if (selectedView === 'inbox') {
      targetListId = 'inbox';
    } else {
      // Ensure we're not using inbox when in board view
      const isValidList = moveableBoardLists.some((l) => l.id === selectedListId);
      targetListId =
        selectedListId === 'inbox' || !isValidList
          ? (moveableBoardLists[0]?.id ?? currentList.id)
          : selectedListId;
    }
    const targetIndex = selectedPosition - 1; // Convert to 0-based index

    copyCard({
      sourceCardId: card.id,
      targetListId,
      targetIndex,
      title: cardTitle.trim() || card.title,
      keepLabels: hasLabels ? keepLabels : false,
      keepComments: hasComments ? keepComments : false,
      keepMembers: hasMembers ? keepMembers : false,
      keepChecklists: hasChecklists ? keepChecklists : false,
      keepCustomFields: hasCustomFieldValues ? keepCustomFields : false,
      targetBoardId: selectedBoardId, // Pass the selected board ID
    });
    onClose();
  };

  const generatePositionOptions = () => {
    const options = [];
    let maxPosition;

    if (selectedView === 'inbox') {
      // Inbox view - positions limited to existing count (min 1 when empty)
      maxPosition = inboxCards.length === 0 ? 1 : inboxCards.length;
    } else {
      // Board view - can add to any position in selected list + end
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
      title="Copy card"
      isOpen={isOpen}
      onClose={onBack || onClose}
      position={modalPosition}
      dataAttribute="data-copy-modal"
      showDivider={true}
      buttonRef={buttonRef}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
      customHeader={onBack ? <ModalBackHeader title="Copy card" onBack={onBack} /> : undefined}
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
                'flex-1 text-left',
                selectedView === 'inbox' && 'bg-gray-200 text-gray-800'
              )}
            >
              Inbox
            </Button>
            <Button
              onClick={() => setSelectedView('board')}
              variant="secondary"
              className={cn(
                'flex-1 text-left',
                selectedView === 'board' && 'bg-gray-200 text-gray-800'
              )}
            >
              Board
            </Button>
          </FlexContainer>
        </div>

        {/* Name Field */}
        <div className="mb-4">
          <Text className="mb-1 block text-xs font-medium text-gray-600">Name</Text>
          <Input
            id="card-copy-name"
            data-testid="card-copy-textarea"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            variant="textarea"
            rows={2}
            placeholder={card.title}
          />
        </div>

        {/* Keep Section */}
        {shouldShowKeepSection && (
          <div className="mb-4">
            <Text className="mb-2 text-xs font-medium text-gray-600">Keep…</Text>
            <div className="space-y-2">
              {keepOptions.map((option) => (
                <label key={option.key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={option.checked}
                    onChange={(e) => option.onChange(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Copy to Section */}
        <div className="space-y-4">
          {selectedView === 'board' ? (
            <>
              <Text className="text-xs font-medium text-gray-600">Copy to…</Text>

              {/* Board Selection */}
              <div className="mt-6">
                <Text className="mb-1 block text-xs font-bold text-gray-600">Board</Text>
                <div className="relative">
                  <select
                    id="board-select"
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {allBoards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.title}
                      </option>
                    ))}
                  </select>
                  <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* List and Position Selection */}
              <div className="flex gap-2">
                {/* List Selection */}
                <div className="flex-[3]">
                  <label
                    htmlFor="list-select"
                    className="mb-1 block text-xs font-bold text-gray-600"
                  >
                    List
                  </label>
                  <div className="relative">
                    <select
                      id="list-select"
                      value={selectedListId}
                      onChange={(e) => {
                        setSelectedListId(e.target.value);
                        setSelectedPosition(1); // Reset position when list changes
                      }}
                      className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {moveableBoardLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title}
                        </option>
                      ))}
                    </select>
                    <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Position Selection */}
                <div className="flex-1">
                  <label
                    htmlFor="position-select"
                    className="mb-1 block text-xs font-bold text-gray-600"
                  >
                    Position
                  </label>
                  <div className="relative">
                    <select
                      id="position-select"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(Number(e.target.value))}
                      className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {generatePositionOptions()}
                    </select>
                    <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                    className="appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {generatePositionOptions()}
                  </select>
                  <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className={modalHeight.footerClasses}>
        <div className="p-3 pt-0">
          {/* Create Button */}
          <div className="mt-4">
            <ActionButton
              onClick={handleCopy}
              variant="primary"
              data-testid="move-card-popover-move-button"
            >
              Create card
            </ActionButton>
          </div>
        </div>
      </div>
    </CardModal>
  );
});

export { CopyCardModal };
