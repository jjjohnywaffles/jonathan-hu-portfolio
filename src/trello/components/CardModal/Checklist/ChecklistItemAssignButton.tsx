import React, { memo, forwardRef } from 'react';
import type { FC } from 'react';
import { IconJoin } from '../../icons/card-modal-action/icon-join';
import { Button } from '../../ui/Button';
import { useChecklistItemAssignedUser } from '@trello/_lib/selectors';

type ChecklistItemAssignButtonProps = {
  cardId: string;
  checklistId: string;
  itemIndex: number;
  onClick: () => void;
};

type ChecklistItemAssignIconButtonProps = {
  cardId: string;
  checklistId: string;
  itemIndex: number;
  onClick: (e: React.MouseEvent) => void;
};

// Button variant - used in edit mode with full text
const ChecklistItemAssignButton = memo(
  forwardRef<HTMLButtonElement, ChecklistItemAssignButtonProps>(function ChecklistItemAssignButton(
    { cardId, checklistId, itemIndex, onClick },
    ref
  ) {
    const assignedUser = useChecklistItemAssignedUser(cardId, checklistId, itemIndex);

    return (
      <Button
        ref={ref}
        onClick={onClick}
        variant="ghost"
        size="sm"
        className="cursor-pointer text-gray-600 hover:text-gray-800"
        title="Assign"
      >
        <IconJoin className="h-4 w-4" />
        {assignedUser ? (
          <span className="max-w-[15ch] truncate">
            {assignedUser.displayName.length > 15
              ? `${assignedUser.displayName.slice(0, 15)}...`
              : assignedUser.displayName}
          </span>
        ) : (
          'Assign'
        )}
      </Button>
    );
  })
);

// Icon variant - used in hover state with compact circular display
const ChecklistItemAssignIconButton = memo(
  forwardRef<HTMLButtonElement, ChecklistItemAssignIconButtonProps>(
    function ChecklistItemAssignIconButton({ cardId, checklistId, itemIndex, onClick }, ref) {
      const assignedUser = useChecklistItemAssignedUser(cardId, checklistId, itemIndex);

      return (
        <button
          ref={ref}
          onClick={onClick}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
          title={assignedUser ? `Assigned to ${assignedUser.displayName}` : 'Assign'}
        >
          {assignedUser ? (
            assignedUser.avatar ? (
              <img
                src={assignedUser.avatar}
                alt={assignedUser.displayName}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700">
                {assignedUser.displayName
                  .split(' ')
                  .map((name) => name[0])
                  .join('')
                  .toUpperCase()}
              </div>
            )
          ) : (
            <IconJoin className="h-3 w-3 text-gray-600" />
          )}
        </button>
      );
    }
  )
);

export { ChecklistItemAssignButton, ChecklistItemAssignIconButton };
