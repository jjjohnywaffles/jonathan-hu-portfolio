import React, { memo, useState } from 'react';
import type { FC } from 'react';
import { IconArchive } from '../icons/card-modal-action/icon-archive';
import { IconCheckmark } from '../icons/card/icon-checkmark';
import { IconChecklist } from '../icons/card/icon-checklist';
import { IconComment } from '../icons/card/icon-comment';
import { IconDescription } from '../icons/card-modal/icon-description';
import { IconWatch } from '../icons/card-modal-action/icon-watch';
import { IconTemplateCard } from '../icons/card/icon-template-card';
import { IconCheckbox } from '../icons/CustomFieldsIcons/IconCheckbox';
import { FlexContainer } from '../ui';
import { getLabelColorClass } from '../../utils/label-colors';
import { DueDate, StartDate } from '../ui/DateDisplay';
import {
  getChecklistGadgetBackgroundColor,
  getChecklistGadgetTextColor,
  formatDueDateForGadget,
} from '../../utils/checklist-utils';
import {
  useCardComments,
  useCardLabels,
  useCardTotalChecklistProgress,
  useCardAssignedUsers,
  useCardChecklistDueDateStatus,
  useCardCustomFields,
  useBoards,
} from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib/index';
import { getUserInitials } from '@trello/utils/user-initials';
import type { Card } from '@trello/_lib/types';

type ArchivedCard = Card & {
  archived: true;
  archivedAt: string;
};

type ArchivedCardDisplayProps = {
  card: ArchivedCard;
  onToggleComplete?: (cardId: string) => void;
  onClick?: () => void;
};

const ArchivedCardDisplay: FC<ArchivedCardDisplayProps> = memo(function ArchivedCardDisplay({
  card,
  onToggleComplete,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const cardComments = useCardComments(card.id);
  const cardLabels = useCardLabels(card.id);
  const { completed, total, hasChecklists } = useCardTotalChecklistProgress(card.id);
  const { hasAnyDueDates, mostUrgentStatus, mostUrgentDueDate } = useCardChecklistDueDateStatus(
    card.id
  );
  const cardCustomFields = useCardCustomFields(card.id);
  const assignedUsers = useCardAssignedUsers(card.id);
  const lists = useTrelloStore((state) => state.lists);
  const boards = useBoards();

  const customFieldsOnFront =
    cardCustomFields?.filter((field) => {
      if (field.type === 'list' && field.value && field.options?.length && field.showOnFront)
        return true;
      if (field.type === 'date' && field.value && field.showOnFront) return true;
      if (field.type === 'checkbox' && field.value === 'true' && field.showOnFront) return true;
      return false;
    }) || [];

  const isMirrorCard = card.isMirror === true;

  // Get original card location info for mirror cards
  const originalCardLocation = (() => {
    if (!isMirrorCard || !card.mirrorOf) return null;

    const state = useTrelloStore.getState();
    const original = state.cards[card.mirrorOf];
    if (!original) return null;

    // Find the list containing the original card
    for (const list of Object.values(lists)) {
      const hasCard = list.cardRefs.some((ref) => ref.cardId === original.id);
      if (hasCard) {
        const board = boards.find((b) => b.id === list.boardId);
        return {
          boardTitle: board?.title ?? 'Unknown Board',
          listTitle: list.title ?? 'Unknown List',
        };
      }
    }
    return null;
  })();

  return (
    <div
      className={`group card-container relative mb-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow transition-all duration-200 hover:border-blue-500 hover:bg-gray-50 ${
        onClick ? 'cursor-pointer' : ''
      } ${isMirrorCard ? 'border-b-4' : ''}`}
      style={isMirrorCard ? { borderBottomColor: '#0079bf' } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Card image (if present) */}
      {card.image && (
        <div className="relative">
          <div className="flex h-32 w-full items-center justify-center bg-gray-200">
            <span className="text-gray-400">Image</span>
          </div>
        </div>
      )}

      {/* For mirrored cards: Mirror info first, then labels underneath */}
      {isMirrorCard ? (
        <>
          {/* Mirror info section - at top for mirror cards */}
          <div className={`px-2 pt-2 ${cardLabels && cardLabels.length > 0 ? 'pb-1' : 'pb-2'}`}>
            {/* Container with light gray background */}
            <div className="inline-flex items-center gap-2 rounded bg-gray-100 px-1 py-0.5">
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

          {/* Label pills underneath mirror info for mirrored cards */}
          {cardLabels && cardLabels.length > 0 && (
            <div className="mt-2 mr-2 mb-1 ml-2 flex flex-wrap gap-1">
              {cardLabels.slice(0, 4).map((label) => (
                <div key={label.id} className="inline-block">
                  <span
                    className={`inline-block h-2 min-w-10 rounded-full px-1.5 text-xs font-medium text-white transition-all hover:opacity-75 ${getLabelColorClass(label.color)}`}
                    title={label.title || label.color}
                  ></span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* For regular cards: Labels at the top */
        cardLabels &&
        cardLabels.length > 0 && (
          <div className="mt-2 ml-2 flex flex-wrap gap-1">
            {cardLabels.slice(0, 4).map((label) => (
              <div key={label.id} className="inline-block">
                <span
                  className={`inline-block h-2 min-w-10 rounded-full px-1.5 text-xs font-medium text-white transition-all hover:opacity-75 ${getLabelColorClass(label.color)}`}
                  title={label.title || label.color}
                ></span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Profile pictures - absolute positioned bottom right, evenly spaced */}
      {assignedUsers.length > 0 && (
        <div className="absolute right-1 bottom-1 z-10 flex flex-row-reverse gap-1">
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

      {/* Main content area */}
      <div
        className={`relative w-full p-2 ${cardLabels && cardLabels.length > 0 ? 'pt-0' : ''} ${
          assignedUsers.length > 0 &&
          !card.watched &&
          !(card.description && card.description.trim()) &&
          cardComments.length === 0 &&
          !card.isTemplate
            ? 'pb-8'
            : ''
        }`}
      >
        {/* Card content */}
        <div className="relative pr-6">
          {/* Completion circle - shows on hover or when completed */}
          {onToggleComplete && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(card.id);
              }}
              className={`absolute top-1 left-0 z-20 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 ease-out ${
                isHovered || card.completed ? 'opacity-100' : 'pointer-events-none opacity-0'
              } ${
                card.completed
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {card.completed && <IconCheckmark className="h-2.5 w-2.5" />}
            </div>
          )}

          {/* Content that shifts on hover when completion toggle is enabled */}
          <div
            className={`transition-transform duration-300 ease-out ${onToggleComplete && (isHovered || card.completed) ? 'translate-x-6 transform' : ''}`}
          >
            {/* Title */}
            <div className="text-sm font-medium break-words whitespace-normal text-gray-800">
              {card.title}
            </div>
          </div>

          {/* Checklist and Dates - stay in place */}
          {(hasChecklists || card.dueDate || card.startDate) && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {hasChecklists && (
                <span
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${
                    completed === total && total > 0
                      ? 'bg-green-600 text-white'
                      : `${getChecklistGadgetBackgroundColor(hasAnyDueDates ? mostUrgentStatus : null)} ${getChecklistGadgetTextColor(hasAnyDueDates ? mostUrgentStatus : null)}`
                  }`}
                >
                  <IconChecklist className="h-3 w-3" />
                  {completed}/{total}
                  {completed !== total && hasAnyDueDates && mostUrgentDueDate && (
                    <>
                      <span className="text-center">•</span>
                      <span className="text-xs font-medium">
                        {formatDueDateForGadget(mostUrgentDueDate)}
                      </span>
                    </>
                  )}
                </span>
              )}
              {card.dueDate ? (
                <DueDate dueDate={card.dueDate} />
              ) : card.startDate ? (
                <StartDate startDate={card.startDate} />
              ) : null}
            </div>
          )}

          {/* Custom Field Gadgets */}
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
                      className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${textColor}`}
                      style={hasColor ? { backgroundColor: selectedOption.color } : undefined}
                    >
                      <span className="text-xs">{field.name}:</span>
                      <span className="text-xs">{selectedOption.label}</span>
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

                return null;
              })}
            </div>
          )}

          {/* Icons */}
          {
            <FlexContainer gap="2" className="mt-2 flex-wrap">
              {card.isTemplate && (
                <div className="flex flex-shrink-0 items-center gap-1 rounded-sm bg-blue-100 px-2 py-1 whitespace-nowrap">
                  <IconTemplateCard className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium text-blue-600">
                    This card is a template.
                  </span>
                </div>
              )}
              {card.watched && <IconWatch className="h-4 w-4 text-gray-500" />}
              {card.description && card.description.trim() && (
                <IconDescription className="h-4 w-4 text-gray-500" />
              )}
              {cardComments.length > 0 && (
                <FlexContainer gap="1">
                  <IconComment className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-600">{cardComments.length}</span>
                </FlexContainer>
              )}

              {/* Archived badge - always show for archived cards */}
              <FlexContainer gap="1">
                <IconArchive className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">Archived</span>
              </FlexContainer>
            </FlexContainer>
          }
        </div>
      </div>
    </div>
  );
});

export { ArchivedCardDisplay };
export type { ArchivedCard };
