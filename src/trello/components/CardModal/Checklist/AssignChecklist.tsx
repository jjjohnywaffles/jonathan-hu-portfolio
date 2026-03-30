import React, { memo, useRef, useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { CardModal } from '../../ui/CardModal';
import { Input } from '../../ui/Input';
import { IconCheckmark } from '../../icons/card/icon-checkmark';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import {
  useUsers,
  useTrelloOperations,
  useChecklistItemAssignedUser,
} from '@trello/_lib/selectors';

type AssignChecklistProps = {
  cardId: string;
  checklistId: string;
  itemIndex: number;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
};

const AssignChecklist: FC<AssignChecklistProps> = memo(function AssignChecklist({
  cardId,
  checklistId,
  itemIndex,
  isOpen,
  onClose,
  buttonRef,
  modalRef: externalModalRef,
}) {
  const allUsers = useUsers();
  const assignedUser = useChecklistItemAssignedUser(cardId, checklistId, itemIndex);
  const { assignUserToChecklistItem, unassignUserFromChecklistItem } = useTrelloOperations();

  const [searchTerm, setSearchTerm] = useState('');

  // Modal positioning
  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: externalModalRef ?? internalModalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 300,
    fallbackWidth: 250,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });
  const modalHeight = useDynamicModalHeight();

  // Convert users record to array for easier filtering
  const allUsersArray = useMemo(() => {
    return Object.values(allUsers);
  }, [allUsers]);

  // Filter and sort users based on search term and assignment status
  const filteredUsers = useMemo(() => {
    let users = allUsersArray;

    // Filter by search term if provided
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      users = users.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort: assigned user first, then alphabetically by display name
    return users.sort((a, b) => {
      const aIsAssigned = assignedUser?.id === a.id;
      const bIsAssigned = assignedUser?.id === b.id;

      // If one is assigned and the other isn't, assigned goes first
      if (aIsAssigned && !bIsAssigned) return -1;
      if (!aIsAssigned && bIsAssigned) return 1;

      // Otherwise sort alphabetically
      return a.displayName.localeCompare(b.displayName);
    });
  }, [allUsersArray, searchTerm, assignedUser]);

  // Reset modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleUserSelect = (userId: string) => {
    assignUserToChecklistItem({ cardId, checklistId, itemIndex, userId });
    onClose();
  };

  const handleRemoveMember = () => {
    unassignUserFromChecklistItem({ cardId, checklistId, itemIndex });
    onClose();
  };

  return (
    <CardModal
      ref={externalModalRef ?? internalModalRef}
      title="Assign"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      dataAttribute="data-assign-checklist-modal"
      buttonRef={buttonRef}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
    >
      {/* Content */}
      <div className={`p-3 ${modalHeight.contentClasses}`}>
        {/* Search Input */}
        <div className="mb-3">
          <Input
            type="text"
            placeholder="Search members"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Board Members Section */}
        <div>
          <h3 className="mb-2 text-xs font-medium text-gray-600">Board members</h3>
          <div className="space-y-1">
            {filteredUsers.map((user) => {
              const isAssigned = assignedUser?.id === user.id;

              return (
                <button
                  key={user.id}
                  className={`flex w-full items-center gap-3 rounded p-2 text-left transition-colors ${
                    isAssigned ? 'bg-gray-100 hover:bg-gray-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                  data-testid={`board-member-${user.id}`}
                >
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        title={user.displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700"
                        title={user.displayName}
                      >
                        {user.displayName
                          .split(' ')
                          .map((name) => name[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {user.displayName}
                    </div>
                    <div className="truncate text-xs text-gray-500">{user.email}</div>
                  </div>

                  {/* Checkmark for assigned user */}
                  {isAssigned && (
                    <div className="flex-shrink-0">
                      <IconCheckmark className="h-4 w-4 text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* No results message */}
          {filteredUsers.length === 0 && searchTerm.trim() && (
            <div className="p-2 text-center text-sm text-gray-500">No members found</div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      {assignedUser && (
        <div className={modalHeight.footerClasses}>
          <div className="p-3 pt-0">
            {/* Remove Member Button - Only show when someone is assigned */}
            <div className="mt-3">
              <button
                onClick={handleRemoveMember}
                className="w-full rounded bg-gray-100 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                Remove member
              </button>
            </div>
          </div>
        </div>
      )}
    </CardModal>
  );
});

export { AssignChecklist };
