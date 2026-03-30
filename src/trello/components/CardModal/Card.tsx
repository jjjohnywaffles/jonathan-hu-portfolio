import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { IconCheckmark } from '../icons/card/icon-checkmark';
import { IconArchive } from '../icons/card/icon-archive';
import { IconEdit } from '../icons/card/icon-edit';
import { IconChecklist } from '../icons/card/icon-checklist';
import { IconCheckbox } from '../icons/CustomFieldsIcons/IconCheckbox';
import { useNotifications } from '../NotificationContext';
import { useTrelloUI } from '../TrelloUIContext';
import { IconComment } from '../icons/card/icon-comment';
import { IconDescription } from '../icons/card-modal/icon-description';
import { IconWatch } from '../icons/card-modal-action/icon-watch';
import { IconTemplateCard } from '../icons/card/icon-template-card';
import { IconTrash } from '../icons/card-modal/icon-trash';
import { Tooltip } from '../Tooltip';
import { getLabelColorClass, getLabelColorDisplayName } from '../../utils/label-colors';
import { FlexContainer, CompletedDateBadge } from '../ui';
import {
  getChecklistGadgetBackgroundColor,
  getChecklistGadgetTextColor,
  formatDueDateForGadget,
} from '../../utils/checklist-utils';
import { getUserInitials } from '@trello/utils/user-initials';
import { mockNow } from '@trello/_lib/shims/time';
import {
  useTrelloOperations,
  useCardComments,
  useCurrentUser,
  useCard,
  useCardList,
  useCardLabels,
  useCardTotalChecklistProgress,
  useCardAssignedUsers,
  useCardChecklistDueDateStatus,
  useCardCustomFields,
  useCardBoard,
  useBoards,
  useIsCardInInbox,
  useList,
} from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib/index';
import type { Card as CardType } from '@trello/_lib/types';
import { isTextEditorActive } from '@trello/utils/text-editor-detection';
import { isPointerWithinElement, usePointerPosition } from '@trello/hooks/use-pointer-position';
import type { PointerPosition } from '@trello/hooks/use-pointer-position';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';
import { cn } from '@trello/_lib/shims/utils';

type CardProps = {
  card: CardType;
  listId?: string;
};

const Card: FC<CardProps> = memo(function Card({ card, listId }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotifications();
  const { openCardModal, activeCardModal } = useTrelloUI();
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');
  const cardComments = useCardComments(card.id);
  const currentUser = useCurrentUser();
  const assignedUsers = useCardAssignedUsers(card.id);
  const currentBoard = useCardBoard(card.id);
  const fallbackList = useCardList(card.id);
  const listFromProp = useList(listId ?? '');
  const currentList = listFromProp ?? fallbackList;
  const isDeletedCard = card.deleted === true;
  const isMirrorCard = card.isMirror === true;
  // Derive deleted state for mirrors from original if needed
  const originalDeleted =
    isMirrorCard && card.mirrorOf
      ? (useTrelloStore.getState().cards[card.mirrorOf]?.deleted ?? false)
      : false;
  const isDeletedMirror = isMirrorCard && (isDeletedCard || originalDeleted);

  // For mirror cards, find where the original card actually lives
  const lists = useTrelloStore((state) => state.lists);
  const boards = useTrelloStore((state) => state.boards);
  const originalCardLocation = useMemo(() => {
    if (!card.isMirror) return null;

    const originalId = card.mirrorOf;
    if (!originalId) return null;

    // Find the list that contains the ORIGINAL card reference
    for (const list of Object.values(lists)) {
      const hasOriginalRef = list.cardRefs.some(
        (ref) => ref.type === 'card' && ref.cardId === originalId
      );
      if (hasOriginalRef) {
        const board = boards[list.boardId];
        return {
          listTitle: list.title,
          boardTitle: board?.title || 'Unknown Board',
        };
      }
    }
    return null;
  }, [card.isMirror, card.mirrorOf, lists, boards]);
  const allBoards = useBoards();

  // Get source board information for cross-board mirrors
  const sourceBoardInfo = useMemo(() => {
    if (!card.boardId) return null;
    return allBoards.find((board) => board.id === card.boardId);
  }, [card.boardId, allBoards]);

  // For CardRef mirrors, the card IS the original (just displayed as mirror)
  // So we can get labels directly from the card
  const cardLabels = useCardLabels(card.id);

  // Pre-render label pills with tooltips for reuse in multiple layouts
  const labelPills = useMemo(() => {
    if (isDeletedMirror) {
      return null;
    }

    if (!cardLabels || cardLabels.length === 0) {
      return null;
    }

    return cardLabels.map((label) => {
      const trimmedTitle = label.title?.trim() ?? '';
      const colorName = getLabelColorDisplayName(label.color);
      const tooltipText = `Color: ${colorName}, title: "${trimmedTitle || 'none'}"`;

      return (
        <Tooltip key={label.id} content={tooltipText} position="bottom" variant="dark" delay={0}>
          <span
            className={`inline-block h-2 min-w-10 rounded-full px-1.5 text-xs font-medium text-white transition-all hover:opacity-75 ${getLabelColorClass(label.color)}`}
            tabIndex={-1}
            aria-label={tooltipText}
            data-color={label.color}
            data-expanded="false"
            data-testid="compact-card-label"
          ></span>
        </Tooltip>
      );
    });
  }, [cardLabels, isDeletedMirror]);

  // Get total checklist progress (combines all checklists)
  const { completed, total, hasChecklists } = useCardTotalChecklistProgress(card.id);

  // Get checklist due date status
  const { hasAnyDueDates, mostUrgentStatus, mostUrgentDueDate } = useCardChecklistDueDateStatus(
    card.id
  );

  // Get custom fields that should show on front of card (but not for inbox cards)
  const cardCustomFields = useCardCustomFields(card.id);
  const isCardInInbox = useIsCardInInbox(card.id);

  const customFieldsOnFront =
    !isCardInInbox && cardCustomFields
      ? cardCustomFields.filter((field) => {
          // Show list fields with values and options
          if (field.type === 'list' && field.value && field.options?.length && field.showOnFront) {
            return true;
          }
          // Show date fields with values
          if (field.type === 'date' && field.value && field.showOnFront) {
            return true;
          }
          // Show checkbox fields only when checked and showOnFront is enabled
          if (field.type === 'checkbox' && field.value === 'true' && field.showOnFront) {
            return true;
          }
          // Show number fields with values
          if (field.type === 'number' && field.value && field.showOnFront) {
            return true;
          }
          // Show text fields with values
          if (field.type === 'text' && field.value && field.showOnFront) {
            return true;
          }
          return false;
        })
      : [];

  // Get operations from the store
  const {
    archiveCard,
    unarchiveCard,
    toggleCardCompletion,
    switchBoard,
    toggleCardWatch,
    joinCard,
    leaveCard,
  } = useTrelloOperations();
  const isTemplateCard = card.isTemplate === true;
  const canToggleCompletion = !isTemplateCard && !isDeletedCard;
  // Global pointer position for keyboard shortcuts and stable hover rendering
  const pointerRef = usePointerPosition();
  const [isPointerInside, setIsPointerInside] = useState(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const inside = isPointerWithinElement(cardRef.current, pointerRef.current);
      setIsPointerInside((prev) => (prev !== inside ? inside : prev));
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [pointerRef]);
  const hoverActive = isHovered || isPointerInside;
  const contentShiftClass = canToggleCompletion
    ? card.completed
      ? 'translate-x-6'
      : hoverActive
        ? 'translate-x-6'
        : 'group-hover:translate-x-6'
    : '';

  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canToggleCompletion) {
      return;
    }

    // Check if we're marking as complete (before the toggle)
    const isMarkingComplete = !card.completed;

    toggleCardCompletion({ cardId: card.id });

    // Show notification if marking as complete in the inbox (which auto-archives)
    if (isMarkingComplete && isCardInInbox) {
      showNotification({
        type: 'archive',
        message: 'Card archived',
        onUndo: () => {
          unarchiveCard({ cardId: card.id });
          showNotification({
            type: 'unarchive',
            message: 'Unarchived card',
            duration: 3000,
          });
        },
      });
    }
  };

  const handleEdit = () => {
    if (isDeletedMirror) {
      return;
    }
    openCardModal(card.id, { isMirror: card.isMirror, listId });
  };

  const handleCardClick = () => {
    if (isDeletedMirror) {
      return;
    }
    openCardModal(card.id, { isMirror: card.isMirror, listId });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Archive the card (works for both regular and mirror cards)
    archiveCard({ cardId: card.id });
    showNotification({
      type: 'archive',
      message: card.isMirror ? 'Mirror card archived' : 'Card archived',
      onUndo: () => {
        unarchiveCard({ cardId: card.id });
        showNotification({
          type: 'unarchive',
          message: card.isMirror ? 'Mirror card unarchived' : 'Unarchived card',
          duration: 3000,
        });
      },
    });
  };

  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    unarchiveCard({ cardId: card.id });
  };

  // Keyboard shortcuts ('c' archive, 's' watch, 'space' join/leave) based on pointer position within this card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyRaw = e.key;
      const key = keyRaw.toLowerCase();
      const isSpace = keyRaw === ' ' || keyRaw === 'Space' || keyRaw === 'Spacebar';
      if (key !== 'c' && key !== 's' && !isSpace) {
        return;
      }
      // Ignore when using system shortcuts or editing text
      if (e.ctrlKey || e.metaKey || isTextEditorActive()) {
        return;
      }
      const el = cardRef.current;
      const pointer = pointerRef.current;
      if (!el || !pointer) {
        return;
      }
      if (!isPointerWithinElement(el, pointer)) {
        return;
      }
      if (key === 'c') {
        if (card.archived || isDeletedCard) {
          return;
        }
        e.preventDefault();
        archiveCard({ cardId: card.id });
        showNotification({
          type: 'archive',
          message: 'Card archived',
          onUndo: () => {
            unarchiveCard({ cardId: card.id });
            showNotification({
              type: 'unarchive',
              message: 'Unarchived card',
              duration: 3000,
            });
          },
        });
        return;
      }
      if (key === 's') {
        e.preventDefault();
        toggleCardWatch({ cardId: card.id });
        return;
      }

      if (isSpace) {
        e.preventDefault();
        if (card.joined === true) {
          leaveCard({ cardId: card.id });
        } else {
          joinCard({ cardId: card.id });
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    card.archived,
    card.joined,
    card.id,
    archiveCard,
    unarchiveCard,
    showNotification,
    isDeletedCard,
    toggleCardWatch,
    joinCard,
    leaveCard,
    pointerRef,
  ]);

  // Don't render archived cards (they should be filtered by selectors, but double-check here)
  if (card.archived && !card.isMirror) {
    return null;
  }

  const baseCardClasses =
    'group card-container relative mb-1.5 overflow-hidden rounded-lg border shadow transition-all duration-200';
  const interactionClasses = isDeletedMirror
    ? 'cursor-pointer border-gray-200 bg-gray-200 hover:border-gray-300 hover:bg-gray-300'
    : 'cursor-pointer border-gray-200 bg-white hover:border-blue-500 hover:bg-gray-50';
  const mirrorBorderClass = card.isMirror && !isDeletedMirror ? 'border-b-4' : '';
  const cardContainerClasses =
    `${baseCardClasses} ${interactionClasses} ${mirrorBorderClass}`.trim();
  const archiveButtonTooltip = isDeletedMirror ? 'Remove mirror card' : 'Archive card';
  const archiveButtonShortcut = isDeletedMirror ? undefined : 'c';
  const mainContentPadding = 'p-2';
  const mainContentTopSpacing =
    !isDeletedMirror && !isCardInInbox && cardLabels && cardLabels.length > 0 ? 'pt-0' : '';
  // Derive archived state for mirrors from original if needed
  const isMirrorArchived =
    card.isMirror === true &&
    ((card.archived ?? false) ||
      (card.mirrorOf
        ? (useTrelloStore.getState().cards[card.mirrorOf]?.archived ?? false)
        : false));

  const mainContentBottomSpacing =
    !isDeletedMirror &&
    assignedUsers.length > 0 &&
    !card.watched &&
    !(card.description && card.description.trim()) &&
    cardComments.length === 0 &&
    !card.isTemplate &&
    !isMirrorArchived
      ? 'pb-8'
      : '';
  const mainContentClasses =
    `${mainContentPadding} ${mainContentTopSpacing} ${mainContentBottomSpacing}`.trim();

  return (
    <>
      <div
        ref={cardRef}
        className={cardContainerClasses}
        style={
          card.isMirror && !isDeletedMirror
            ? {
                borderBottomColor: '#0079bf',
              }
            : undefined
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();

          if (isDeletedMirror) {
            return;
          }

          // Only open modal if it's not already open for this card
          if (activeCardModal !== card.id) {
            // Always open modal in current board context
            openCardModal(card.id, { isMirror: card.isMirror, listId });
          } else {
          }
        }}
      >
        {/* For mirrored cards: Mirror info first, then labels underneath */}
        {card.isMirror && !isDeletedMirror ? (
          <>
            {/* Mirror info section - at top for mirror cards */}
            {currentList && (
              <div className={`px-2 pt-2 ${cardLabels && cardLabels.length > 0 ? 'pb-1' : 'pb-2'}`}>
                {/* Hoverable container with light gray background - clickable to go to source */}
                <div
                  className="inline-flex cursor-pointer items-center gap-2 rounded bg-gray-100 px-1 py-0.5 transition-colors duration-200 hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card modal from opening
                    if (!card.isMirror || !card.mirrorOf) {
                      return; // Only actionable for mirror cards
                    }

                    const state = useTrelloStore.getState();
                    const original = state.cards[card.mirrorOf];
                    const originalBoardId = original?.boardId;
                    if (originalBoardId && originalBoardId !== state.currentBoardId) {
                      // Different board - navigate to the original card's board
                      switchBoard({ boardId: originalBoardId });
                    }
                    // Same board or unknown original - no-op
                  }}
                >
                  {/* Colored square - centered vertically */}
                  <div
                    className="h-6 w-6 flex-shrink-0 rounded"
                    style={{ backgroundColor: '#0079bf' }}
                  />

                  {/* Text content */}
                  <div>
                    {/* Board name */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-gray-700">
                        {originalCardLocation?.boardTitle || 'Unknown Board'}
                      </span>
                    </div>
                    {/* List title */}
                    <div className="text-xs text-gray-600" style={{ fontSize: '10px' }}>
                      {originalCardLocation?.listTitle || 'Unknown List'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Label pills underneath mirror info for mirrored cards */}
            {labelPills && (
              <div className="mt-2 mr-2 mb-1 ml-2 flex flex-wrap content-start gap-x-1 gap-y-1">
                {labelPills}
              </div>
            )}
          </>
        ) : (
          /* For regular cards: Labels at the top */
          !isCardInInbox &&
          labelPills && (
            <div className="mt-2 mr-2 mb-1 ml-2 flex flex-wrap content-start gap-x-1 gap-y-1">
              {labelPills}
            </div>
          )
        )}

        {/* Profile pictures for assigned users - positioned relative to card container */}
        {!isDeletedMirror && assignedUsers.length > 0 && (
          <div className="absolute right-1 bottom-1 z-[1] flex flex-row gap-1">
            {assignedUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    title={user.displayName}
                    className="h-6 w-6 rounded-full border border-white object-cover shadow-sm"
                  />
                ) : (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-gray-300 text-xs font-semibold text-gray-700 shadow-sm"
                    title={user.displayName}
                  >
                    {getUserInitials(user.displayName)}
                  </div>
                )}
              </div>
            ))}
            {assignedUsers.length > 5 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-gray-500 text-xs font-semibold text-white shadow-sm">
                +{assignedUsers.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Hover controls - positioned relative to card edges */}
        <div
          className={`pointer-events-none absolute top-[3px] right-0.5 z-[2] flex items-center gap-0.5 opacity-0 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:opacity-100 ${hoverActive ? 'pointer-events-auto opacity-100' : ''}`}
        >
          {/* Archive button - shows when card is completed OR when it's a mirror card */}
          {(card.completed || card.isMirror) && (
            <Tooltip
              content={archiveButtonTooltip}
              shortcut={archiveButtonShortcut}
              position="bottom"
              variant="dark"
            >
              <button
                onClick={isOnlyHotkeys ? undefined : handleArchive}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700',
                  isOnlyHotkeys && 'matrices-disabled'
                )}
                aria-label={archiveButtonTooltip}
              >
                {isDeletedMirror ? (
                  <IconTrash className="h-3.5 w-3.5" />
                ) : (
                  <IconArchive className="h-3.5 w-3.5" />
                )}
              </button>
            </Tooltip>
          )}

          {/* Edit button */}
          <Tooltip content="Edit card" position="bottom" variant="dark">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Edit card"
            >
              <IconEdit className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Main content area */}
        <div className={mainContentClasses}>
          {isDeletedMirror ? (
            <div className="px-2 py-0 text-sm font-medium text-gray-700">
              Card not found. It was probably deleted.
            </div>
          ) : (
            <div className="relative pr-6">
              {/* Completion indicator */}
              {canToggleCompletion ? (
                <div
                  className={`absolute top-1 left-0 z-[3] flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 ease-out ${
                    card.completed
                      ? 'opacity-100'
                      : `pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 ${hoverActive ? 'pointer-events-auto opacity-100' : ''}`
                  } ${
                    card.completed
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  } `}
                  onClick={handleToggleCompletion}
                >
                  {card.completed && <IconCheckmark className="h-2.5 w-2.5" />}
                </div>
              ) : null}
              {/* Content that shifts on hover */}
              <div
                className={`transform transition-transform duration-300 ease-out ${contentShiftClass}`}
              >
                {/* Image (if present) */}
                {card.image && (
                  <div className="mb-2">
                    <div className="mb-2 flex h-28 w-full items-center justify-center rounded bg-gray-200">
                      {/* Placeholder image */}
                      <span className="text-gray-400">Image</span>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="text-sm font-medium break-words whitespace-normal text-gray-800">
                  {card.title}
                </div>
              </div>

              {/* Checklist and Dates - stay in place, don't shift */}
              {((hasChecklists && !isCardInInbox) || card.dueDate || card.startDate) && (
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {/* Checklist progress */}
                  {hasChecklists && !isCardInInbox && (
                    <Tooltip content="Checklist items" position="bottom" variant="dark">
                      <span
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${
                          completed === total && total > 0
                            ? 'bg-green-600 text-white'
                            : `${getChecklistGadgetBackgroundColor(hasAnyDueDates ? mostUrgentStatus : null)} ${getChecklistGadgetTextColor(hasAnyDueDates ? mostUrgentStatus : null)}`
                        }`}
                      >
                        <IconChecklist className="h-3 w-3" />
                        {completed}/{total}
                        {/* Only show due date if not all tasks are complete */}
                        {completed !== total && hasAnyDueDates && mostUrgentDueDate && (
                          <>
                            <span className="text-center">•</span>
                            <span className="text-xs font-medium">
                              {formatDueDateForGadget(mostUrgentDueDate)}
                            </span>
                          </>
                        )}
                      </span>
                    </Tooltip>
                  )}
                  {/* Due date (takes priority over start date) */}
                  <CompletedDateBadge
                    dueDate={card.dueDate}
                    startDate={card.startDate}
                    isCompleted={card.completed}
                    isInbox={false}
                  />
                </div>
              )}

              {/* Custom Field Gadgets - stay in place, don't shift */}
              {customFieldsOnFront.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  {customFieldsOnFront.map((field) => {
                    if (field.type === 'list') {
                      const selectedOption = field.options?.find(
                        (option) => option.label === field.value
                      );
                      if (!selectedOption) return null;

                      const hasColor = selectedOption.color && selectedOption.color !== '';
                      const textColor = hasColor ? 'text-white' : 'text-gray-700';

                      return (
                        <span
                          key={field.id}
                          className={`flex max-w-[240px] items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 font-medium ${textColor}`}
                          style={hasColor ? { backgroundColor: selectedOption.color } : undefined}
                        >
                          <span className="text-xs whitespace-nowrap">{field.name}:</span>
                          <span className="truncate text-xs">{selectedOption.label}</span>
                        </span>
                      );
                    }

                    if (field.type === 'date') {
                      if (!field.value) return null;

                      const dateOnly = field.value.split(' at ')[0];

                      return (
                        <span
                          key={field.id}
                          className="flex items-center gap-1 font-medium text-gray-600"
                        >
                          <span className="text-xs">{field.name}:</span>
                          <span className="text-xs">{dateOnly}</span>
                        </span>
                      );
                    }

                    if (field.type === 'checkbox') {
                      return (
                        <span
                          key={field.id}
                          className="flex items-center gap-1 font-medium text-gray-600"
                        >
                          <IconCheckbox className="h-3 w-3 text-gray-600" />
                          <span className="text-xs">{field.name}</span>
                        </span>
                      );
                    }

                    if (field.type === 'number') {
                      if (!field.value) return null;

                      const formattedNumber = Number(field.value).toLocaleString('en-US');

                      return (
                        <span
                          key={field.id}
                          className="flex max-w-[240px] items-center gap-1 overflow-hidden text-xs font-medium text-gray-600"
                        >
                          <span className="whitespace-nowrap">{field.name}:</span>
                          <span className="truncate">{formattedNumber}</span>
                        </span>
                      );
                    }

                    if (field.type === 'text') {
                      if (!field.value) return null;

                      return (
                        <span
                          key={field.id}
                          className="flex max-w-[240px] items-center gap-1 overflow-hidden text-xs font-medium text-gray-600"
                        >
                          <span className="whitespace-nowrap">{field.name}:</span>
                          <span className="truncate">{field.value}</span>
                        </span>
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* Icons that stay in place */}
              {card.watched ||
              (card.description && card.description.trim()) ||
              cardComments.length > 0 ||
              card.isTemplate ||
              isMirrorArchived ? (
                <FlexContainer gap="2" className="mt-2">
                  {card.isTemplate && (
                    <div className="flex flex-shrink-0 items-center gap-1 rounded-sm bg-blue-100 px-2 py-1 whitespace-nowrap">
                      <IconTemplateCard className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs font-medium text-blue-600">
                        This card is a template.
                      </span>
                    </div>
                  )}

                  {card.watched && (
                    <Tooltip content="You are watching this card." position="bottom" variant="dark">
                      <IconWatch className="h-4 w-4 text-gray-500" />
                    </Tooltip>
                  )}

                  {card.description && card.description.trim() && (
                    <Tooltip
                      content="This card has a description."
                      position="bottom"
                      variant="dark"
                    >
                      <IconDescription className="h-4 w-4 text-gray-500" />
                    </Tooltip>
                  )}

                  {cardComments.length > 0 && (
                    <Tooltip content="Comments" position="bottom" variant="dark">
                      <FlexContainer gap="1">
                        <IconComment className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-600">{cardComments.length}</span>
                      </FlexContainer>
                    </Tooltip>
                  )}

                  {isMirrorArchived && (
                    <FlexContainer gap="1">
                      <IconArchive className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Archived</span>
                    </FlexContainer>
                  )}
                </FlexContainer>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export { Card };
