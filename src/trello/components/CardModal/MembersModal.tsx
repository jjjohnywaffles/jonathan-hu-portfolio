import React, { memo, useRef, useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { CardModal } from '../ui/CardModal';
import { ModalBackHeader } from '../ui/ModalBackHeader';
import { Input } from '../ui/Input';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import {
  useCard,
  useUsers,
  useCardAssignedUsers,
  useTrelloOperations,
  useCurrentUser,
} from '@trello/_lib/selectors';
import { getUserInitials } from '@trello/utils/user-initials';

type MembersModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
};

const MembersModal: FC<MembersModalProps> = memo(function MembersModal({
  cardId,
  isOpen,
  onClose,
  onBack,
  buttonRef,
  modalRef: externalModalRef,
}) {
  const card = useCard(cardId);
  const allUsers = useUsers();
  const assignedUsers = useCardAssignedUsers(cardId);
  const currentUser = useCurrentUser();
  const { joinCard, leaveCard, assignUserToCard, unassignUserFromCard } = useTrelloOperations();
  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalRef = externalModalRef || internalModalRef;

  const [searchTerm, setSearchTerm] = useState('');
  const modalHeight = useDynamicModalHeight();
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 300,
    fallbackHeight: 420,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Convert users record to array for easier filtering
  const allUsersArray = useMemo(() => {
    return Object.values(allUsers);
  }, [allUsers]);

  // Separate assigned and unassigned users
  const { cardMembers, boardMembers } = useMemo(() => {
    const assignedUserIds = new Set(assignedUsers.map((user) => user.id));

    const cardMembers = assignedUsers;
    const boardMembers = allUsersArray.filter((user) => !assignedUserIds.has(user.id));

    return { cardMembers, boardMembers };
  }, [allUsersArray, assignedUsers]);

  // Filter users based on search term
  const filteredBoardMembers = useMemo(() => {
    if (!searchTerm.trim()) return boardMembers;

    const searchLower = searchTerm.toLowerCase();
    return boardMembers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }, [boardMembers, searchTerm]);

  // Filter card members based on search term too
  const filteredCardMembers = useMemo(() => {
    if (!searchTerm.trim()) return cardMembers;

    const searchLower = searchTerm.toLowerCase();
    return cardMembers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }, [cardMembers, searchTerm]);

  // Check if a user is assigned to the card
  const isUserAssigned = (userId: string): boolean => {
    return assignedUsers.some((user) => user.id === userId);
  };

  // Reset modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!card) return null;

  const handleUserToggle = (userId: string) => {
    if (isUserAssigned(userId)) {
      // If it's the current user, use leaveCard, otherwise unassign directly
      if (userId === currentUser?.id) {
        leaveCard({ cardId });
      } else {
        unassignUserFromCard({ cardId, userId });
      }
    } else {
      // If it's the current user, use joinCard, otherwise assign directly
      if (userId === currentUser?.id) {
        joinCard({ cardId });
      } else {
        assignUserToCard({ cardId, userId });
      }
    }
  };

  const handleRemoveFromCard = (userId: string) => {
    // For removing from card members - always use leave/unassign
    if (userId === currentUser?.id) {
      leaveCard({ cardId });
    } else {
      unassignUserFromCard({ cardId, userId });
    }
  };

  return (
    <CardModal
      ref={modalRef}
      title="Members"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: position.top, left: position.left }}
      dataAttribute="data-members-modal"
      buttonRef={buttonRef}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
      customHeader={
        onBack ? <ModalBackHeader title="Members" onBack={onBack} onClose={onClose} /> : undefined
      }
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

        {/* Card Members Section */}
        {filteredCardMembers.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-medium text-gray-600">Card members</h3>
            <div className="space-y-1">
              {filteredCardMembers.map((user) => (
                <button
                  key={user.id}
                  className="flex w-full items-center gap-3 rounded p-2 text-left transition-colors hover:bg-gray-100"
                  onClick={() => handleRemoveFromCard(user.id)}
                  data-testid={`card-member-${user.id}`}
                  aria-label={`Remove ${user.displayName} from card`}
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
                        {getUserInitials(user.displayName)}
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

                  {/* Remove Icon (visual indicator) */}
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-sm p-0 text-gray-500">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Board Members Section */}
        <div>
          <h3 className="mb-2 text-xs font-medium text-gray-600">Board members</h3>
          <div className="space-y-1">
            {filteredBoardMembers.map((user) => (
              <button
                key={user.id}
                className="flex w-full items-center gap-3 rounded p-2 text-left transition-colors hover:bg-gray-100"
                onClick={() => handleUserToggle(user.id)}
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
                      {getUserInitials(user.displayName)}
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
              </button>
            ))}
          </div>

          {/* No results message */}
          {filteredBoardMembers.length === 0 &&
            filteredCardMembers.length === 0 &&
            searchTerm.trim() && (
              <div className="py-4 text-center text-sm text-gray-500">
                No members found matching "{searchTerm}"
              </div>
            )}
        </div>
      </div>
    </CardModal>
  );
});

export { MembersModal };
