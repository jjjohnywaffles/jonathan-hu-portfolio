import React, { memo } from 'react';
import type { FC } from 'react';
import { IconDueDate } from '@trello/components/icons/card/icon-duedate';
import { getDueDateInfo, getStartDateInfo } from '@trello/utils/due-date';
import { DueDate, StartDate } from '@trello/components/ui/DateDisplay';
import { Tooltip } from '@trello/components/Tooltip';

type CompletedDateBadgeProps = {
  dueDate?: string;
  startDate?: string;
  isCompleted?: boolean;
  isInbox?: boolean;
};

/**
 * Displays a date badge that shows green when a card is completed in the inbox,
 * otherwise falls back to the standard date display components.
 * Handles both due dates and start dates with proper formatting.
 */
const CompletedDateBadge: FC<CompletedDateBadgeProps> = memo(function CompletedDateBadge({
  dueDate,
  startDate,
  isCompleted,
  isInbox,
}) {
  const showGreenBadge = isCompleted;

  // Due date takes priority over start date
  if (dueDate) {
    if (showGreenBadge) {
      const { displayText } = getDueDateInfo(dueDate);
      return (
        <Tooltip content="This card is complete." position="bottom" variant="dark">
          <span className="flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs text-white">
            <IconDueDate className="h-3 w-3" />
            {displayText}
          </span>
        </Tooltip>
      );
    }
    return <DueDate dueDate={dueDate} />;
  }

  // Show start date if no due date
  if (startDate) {
    if (showGreenBadge) {
      const { displayText, status } = getStartDateInfo(startDate);
      const statusPrefix = status === 'started' ? 'Started:' : 'Starts:';
      return (
        <Tooltip content="This card is complete." position="bottom" variant="dark">
          <span className="flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs text-white">
            <IconDueDate className="h-3 w-3" />
            {statusPrefix} {displayText}
          </span>
        </Tooltip>
      );
    }
    return <StartDate startDate={startDate} />;
  }

  return null;
});

export { CompletedDateBadge };
