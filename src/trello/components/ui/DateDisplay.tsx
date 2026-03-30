import React, { memo, forwardRef } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { IconDueDate } from '../icons/card/icon-duedate';
import { IconDown } from '../icons/card-modal/icon-down';
import { Tooltip } from '../Tooltip';
import { getDueDateInfo, getStartDateInfo } from '../../utils/due-date';
import type { DueDateStatus } from '../../utils/due-date';
import { mockNow } from '@trello/_lib/shims/time';
import { cn } from '@trello/_lib/shims/utils';

// Base props for all date display variants
type BaseDateProps = {
  className?: string;
};

// Card front display props (non-clickable spans)
type CardFrontDateProps = BaseDateProps & {
  variant: 'card-due-date' | 'card-start-date';
  dueDate?: string;
  startDate?: string;
};

// Card back badge props (clickable buttons)
type CardBackBadgeProps = BaseDateProps & {
  variant: 'badge-due-date' | 'badge-start-date';
  dueDate?: string;
  startDate?: string;
  onClick: () => void;
  isCompleted?: boolean;
};

type DateDisplayProps = CardFrontDateProps | CardBackBadgeProps;

// Type guards
function isCardFrontVariant(props: DateDisplayProps): props is CardFrontDateProps {
  return props.variant === 'card-due-date' || props.variant === 'card-start-date';
}

function isCardBackVariant(props: DateDisplayProps): props is CardBackBadgeProps {
  return props.variant === 'badge-due-date' || props.variant === 'badge-start-date';
}

// Helper function to get tooltip text based on due date status and time remaining
function getDueDateTooltip(dueDate: string, status: DueDateStatus): string {
  const due = DateTime.fromISO(dueDate);
  const now = mockNow();
  const diffInMinutes = due.diff(now, 'minutes').minutes;

  switch (status) {
    case 'due-later':
      return 'This card is due later';
    case 'due-soon':
      // Check if due in less than an hour
      if (diffInMinutes < 60) {
        return 'This card is due in less than an hour';
      }
      return 'This card is due in less than twenty-four hours.';
    case 'recently-overdue':
      return 'This card is recently overdue!';
    case 'overdue':
      return 'This card is past due.';
    default:
      return 'This card is due later';
  }
}

const DateDisplay = memo(
  forwardRef<HTMLButtonElement | HTMLSpanElement, DateDisplayProps>(
    function DateDisplay(props, ref) {
      const { variant, className = '' } = props;

      // Card front variants (non-clickable spans)
      if (isCardFrontVariant(props)) {
        if (variant === 'card-due-date') {
          if (!props.dueDate) return null;

          const { bgColor, textColor, displayText, status } = getDueDateInfo(props.dueDate);

          const tooltipText = getDueDateTooltip(props.dueDate, status);

          return (
            <Tooltip content={tooltipText} position="bottom" variant="dark">
              <span
                ref={ref as React.Ref<HTMLSpanElement>}
                className={cn(
                  'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs',
                  bgColor,
                  textColor,
                  className
                )}
              >
                <IconDueDate className="h-3 w-3" />
                {displayText}
              </span>
            </Tooltip>
          );
        }

        if (variant === 'card-start-date') {
          if (!props.startDate) return null;

          const start = DateTime.fromISO(props.startDate);
          const now = mockNow();
          const diffInDays = start.diff(now, 'days').days;

          // Determine status based on whether start date has passed
          const status = diffInDays <= 0 ? 'started' : 'starts';

          // Get status prefix text
          const getStatusPrefix = (status: string): string => {
            switch (status) {
              case 'started':
                return 'Started:';
              case 'starts':
                return 'Starts:';
              default:
                return '';
            }
          };

          // Format display text for front of card - always use full date format
          const yearDiff = Math.abs(start.year - now.year);
          const isOverYearAway = Math.abs(diffInDays) > 365;
          const isDifferentYear = start.year !== now.year;

          const displayText =
            isOverYearAway || isDifferentYear
              ? start.toFormat('MMM d, yyyy')
              : start.toFormat('MMM d');

          const statusPrefix = getStatusPrefix(status);

          return (
            <span
              ref={ref as React.Ref<HTMLSpanElement>}
              className={cn('flex items-center gap-1 text-xs text-gray-600', className)}
            >
              <IconDueDate className="h-3 w-3" />
              {statusPrefix} {displayText}
            </span>
          );
        }
      }

      // Card back variants (clickable buttons)
      if (isCardBackVariant(props)) {
        const { onClick, isCompleted } = props;

        if (variant === 'badge-due-date') {
          // Determine which date to display and whether it's a start date only
          const isStartDateOnly = !props.dueDate && props.startDate;
          const displayDate = props.dueDate || props.startDate;

          if (!displayDate) {
            return null;
          }

          const { status, displayText } = isStartDateOnly
            ? getStartDateInfo(displayDate)
            : getDueDateInfo(displayDate);

          // Parse the date to get time and format it (only for due dates, not start dates)
          const dateTime = DateTime.fromISO(displayDate);
          const timeString = dateTime.toFormat('h:mm a');
          const fullDateTimeText = isStartDateOnly ? displayText : `${displayText}, ${timeString}`;

          // Get status text - show "Completed" if card is completed
          const getStatusText = (status: string, isCompleted?: boolean): string => {
            if (isCompleted) {
              return 'Completed';
            }

            switch (status) {
              case 'overdue':
                return 'Overdue';
              case 'recently-overdue':
                return 'Overdue';
              case 'due-soon':
                return 'Due soon';
              case 'due-later':
                return 'Due later';
              case 'started':
                return 'Started';
              case 'starts':
                return 'Starts';
              default:
                return '';
            }
          };

          const statusText = getStatusText(status, isCompleted);

          // Get status color class - show green if completed
          const getStatusColorClass = (status: string, isCompleted?: boolean): string => {
            if (isCompleted) {
              return 'text-green-600';
            }

            switch (status) {
              case 'overdue':
              case 'recently-overdue':
                return 'text-red-600';
              case 'due-soon':
                return 'text-yellow-600';
              case 'due-later':
              case 'started':
              case 'starts':
              default:
                return 'text-gray-600';
            }
          };

          return (
            <button
              ref={ref as React.Ref<HTMLButtonElement>}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }}
              className={cn(
                'flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors',
                isStartDateOnly ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 hover:bg-gray-200',
                className
              )}
              data-testid="due-date-badge-with-date-range-picker"
            >
              <span className="font-medium text-gray-800">{fullDateTimeText}</span>
              <span className={cn('text-xs font-medium', getStatusColorClass(status, isCompleted))}>
                {statusText}
              </span>
              <IconDown className="h-4 w-4 text-gray-600" />
            </button>
          );
        }

        if (variant === 'badge-start-date') {
          if (!props.startDate) return null;

          const { displayText } = getStartDateInfo(props.startDate);

          return (
            <button
              ref={ref as React.Ref<HTMLButtonElement>}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }}
              className={cn(
                'flex items-center gap-2 rounded bg-gray-100 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-200',
                className
              )}
              data-testid="start-date-badge-with-date-range-picker"
            >
              <span className="font-medium text-gray-800">{displayText}</span>
              <IconDown className="h-4 w-4 text-gray-600" />
            </button>
          );
        }
      }

      return null;
    }
  )
);

// Convenience wrapper components that maintain the original APIs
const DueDate: FC<{ dueDate: string; className?: string }> = memo(function DueDate(props) {
  return <DateDisplay variant="card-due-date" {...props} />;
});

const StartDate: FC<{ startDate: string; className?: string }> = memo(function StartDate(props) {
  return <DateDisplay variant="card-start-date" {...props} />;
});

const DueDateBadge = memo(
  forwardRef<
    HTMLButtonElement,
    {
      dueDate?: string;
      startDate?: string;
      onClick: () => void;
      className?: string;
      isCompleted?: boolean;
    }
  >(function DueDateBadge(props, ref) {
    return <DateDisplay variant="badge-due-date" ref={ref} {...props} />;
  })
);

const StartDateBadge = memo(
  forwardRef<HTMLButtonElement, { startDate: string; onClick: () => void; className?: string }>(
    function StartDateBadge(props, ref) {
      return <DateDisplay variant="badge-start-date" ref={ref} {...props} />;
    }
  )
);

export { DateDisplay, DueDate, StartDate, DueDateBadge, StartDateBadge };
