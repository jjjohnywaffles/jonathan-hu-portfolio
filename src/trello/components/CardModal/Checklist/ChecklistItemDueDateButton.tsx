import React, { memo, forwardRef } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { Button } from '../../ui/Button';
import { IconClock } from '../../icons/card-modal/icon-clock';
import { getDueDateInfo } from '../../../utils/due-date';
import { mockNow } from '@trello/_lib/shims/time';
import { useChecklistItemDueDate, useChecklistItemChecked } from '@trello/_lib/selectors';

type ChecklistItemDueDateButtonProps = {
  cardId: string;
  checklistId: string;
  itemIndex: number;
  onClick: () => void;
  variant?: 'button' | 'icon';
};

// Button variant - used in edit mode with full text
const ChecklistItemDueDateButton = memo(
  forwardRef<HTMLButtonElement, ChecklistItemDueDateButtonProps>(
    function ChecklistItemDueDateButton({ cardId, checklistId, itemIndex, onClick }, ref) {
      const dueDate = useChecklistItemDueDate(cardId, checklistId, itemIndex);
      const isChecked = useChecklistItemChecked(cardId, checklistId, itemIndex);

      if (!dueDate) {
        // No due date - show "Due date" text
        return (
          <Button
            ref={ref}
            onClick={onClick}
            variant="ghost"
            size="sm"
            className="cursor-pointer text-gray-600 hover:text-gray-700"
            title="Due date"
          >
            <IconClock className="h-4 w-4" />
            Due date
          </Button>
        );
      }

      // Has due date - show the formatted date
      const { status } = getDueDateInfo(dueDate);
      const due = DateTime.fromISO(dueDate);
      const now = mockNow();

      // Check if due date is over a year away
      const diffInDays = Math.abs(due.diff(now, 'days').days);
      const isOverYearAway = diffInDays > 365;
      const isDifferentYear = due.year !== now.year;

      // Format for button text: short date format
      const displayText =
        isOverYearAway || isDifferentYear
          ? due.toFormat('MMM d, yyyy') // "Jan 1, 2024"
          : due.toFormat('MMM d'); // "Jan 1"

      // Get text color based on status (override with green if completed)
      const getTextColor = (status: string, isChecked: boolean): string => {
        if (isChecked) {
          return 'text-green-500 hover:text-green-600';
        }
        switch (status) {
          case 'overdue':
          case 'recently-overdue':
            return 'text-red-600 hover:text-red-700';
          case 'due-soon':
            return 'text-yellow-600 hover:text-yellow-700';
          case 'due-later':
          default:
            return 'text-gray-600 hover:text-gray-700';
        }
      };

      return (
        <Button
          ref={ref}
          onClick={onClick}
          variant="ghost"
          size="sm"
          className={`cursor-pointer ${getTextColor(status, isChecked)}`}
          title={`Due ${due.toFormat("MMM d, yyyy 'at' h:mm a")}`}
        >
          <IconClock className="h-4 w-4" />
          {displayText}
        </Button>
      );
    }
  )
);

// Icon variant - used in hover state with compact circular display
const ChecklistItemDueDateIconButton = memo(
  forwardRef<HTMLButtonElement, ChecklistItemDueDateButtonProps>(
    function ChecklistItemDueDateIconButton({ cardId, checklistId, itemIndex, onClick }, ref) {
      const dueDate = useChecklistItemDueDate(cardId, checklistId, itemIndex);
      const isChecked = useChecklistItemChecked(cardId, checklistId, itemIndex);

      if (!dueDate) {
        // No due date - show clock icon
        return (
          <button
            ref={ref}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
            title="Due date"
          >
            <IconClock className="h-3 w-3 text-gray-600" />
          </button>
        );
      }

      // Has due date - show colored circle with abbreviated date
      const { status } = getDueDateInfo(dueDate);
      const due = DateTime.fromISO(dueDate);
      const now = mockNow();

      // Check if due date is over a year away
      const diffInDays = Math.abs(due.diff(now, 'days').days);
      const isOverYearAway = diffInDays > 365;
      const isDifferentYear = due.year !== now.year;

      // Format: abbreviated month, day, and year if over a year away
      const displayText =
        isOverYearAway || isDifferentYear
          ? due.toFormat('LLL d, yy') // "Jan 1, 24"
          : due.toFormat('LLL d'); // "Jan 1"

      // Get background color class based on status (override with green if completed)
      const getBackgroundColor = (status: string, isChecked: boolean): string => {
        if (isChecked) {
          return 'bg-green-500 hover:bg-green-600';
        }
        switch (status) {
          case 'overdue':
            return 'bg-red-100 hover:bg-red-200';
          case 'recently-overdue':
            return 'bg-red-600 hover:bg-red-700';
          case 'due-soon':
            return 'bg-yellow-400 hover:bg-yellow-500'; // More solid yellow with darker hover
          case 'due-later':
          default:
            return 'bg-gray-100 hover:bg-gray-200';
        }
      };

      // Get text color class based on status (override with green if completed)
      const getTextColor = (status: string, isChecked: boolean): string => {
        if (isChecked) {
          return 'text-white';
        }
        switch (status) {
          case 'overdue':
            return 'text-red-800';
          case 'recently-overdue':
            return 'text-white';
          case 'due-soon':
            return 'text-yellow-900'; // Darker text for better contrast with solid yellow
          case 'due-later':
          default:
            return 'text-gray-600';
        }
      };

      return (
        <button
          ref={ref}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`flex h-6 w-auto min-w-[24px] cursor-pointer items-center justify-center gap-1 rounded-full px-1 transition-colors ${getBackgroundColor(status, isChecked)}`}
          title={`Due ${due.toFormat("MMM d, yyyy 'at' h:mm a")}`}
        >
          <IconClock className={`h-3 w-3 ${getTextColor(status, isChecked)}`} />
          <span
            className={`text-xs font-medium ${getTextColor(status, isChecked)} whitespace-nowrap`}
          >
            {displayText}
          </span>
        </button>
      );
    }
  )
);

export { ChecklistItemDueDateButton, ChecklistItemDueDateIconButton };
