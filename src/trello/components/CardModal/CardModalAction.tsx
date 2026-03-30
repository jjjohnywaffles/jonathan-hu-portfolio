import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
import type { FC } from 'react';
import { IconJoin } from '../icons/card-modal-action/icon-join';
import { IconLeave } from '../icons/card-modal-action/icon-leave';
import { IconMove } from '../icons/card-modal-action/icon-move';
import { IconCopy } from '../icons/card-modal-action/icon-copy';
import { IconMirror } from '../icons/card-modal-action/icon-mirror';
import { IconMakeTemplate } from '../icons/card-modal-action/icon-make-template';
import { IconWatch } from '../icons/card-modal-action/icon-watch';
import { IconShare } from '../icons/card-modal-action/icon-share';
import { IconArchive } from '../icons/card-modal-action/icon-archive';
import { IconRestore } from '../icons/card-modal-action/icon-restore';
import { IconDelete } from '../icons/card-modal-action/icon-delete';
import { IconCheckmark } from '../icons/card/icon-checkmark';
import { useModalClickOutside } from '../../hooks/use-modal-click-outside';
import { ModalContainer, MenuButton } from '../ui';
import { ConfirmDeleteCardModal } from './ConfirmDeleteCardModal';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useTrelloOperations, useCard } from '@trello/_lib/selectors';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';

type CardModalActionProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  onOpenMoveModal?: () => void;
  onOpenCopyModal?: () => void;
  onOpenMirrorModal?: () => void;
  onSetPendingArchive?: () => void;
  onClearPendingArchive?: () => void;
  pendingArchiveTimestamp?: string | null;
  variant?: 'normal' | 'inbox'; // Inbox variant shows simplified actions
};

const CardModalAction: FC<CardModalActionProps> = memo(function CardModalAction({
  cardId,
  isOpen,
  onClose,
  buttonRef,
  onOpenMoveModal,
  onOpenCopyModal,
  onOpenMirrorModal,
  onSetPendingArchive,
  onClearPendingArchive,
  pendingArchiveTimestamp,
  variant = 'normal',
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  // Use the modal positioning hook
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 224,
    fallbackHeight: 400,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  const card = useCard(cardId);
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');
  const {
    joinCard,
    leaveCard,
    toggleCardWatch,
    deleteCard,
    unarchiveCard,
    archiveCard,
    makeCardTemplate,
    removeCardTemplate,
  } = useTrelloOperations();

  // Reusable Tailwind classes
  const checkmarkContainerClasses = 'absolute top-1/2 right-3 -translate-y-1/2 transform';
  const checkmarkBoxClasses = 'flex h-4 w-4 items-center justify-center rounded-sm bg-green-500';
  const checkmarkIconClasses = 'h-3 w-3 text-white';

  // Optimized handlers using useCallback for performance
  const handleToggleTemplate = useCallback(() => {
    if (!card) {
      return;
    }
    // Ensure template toggle targets the original card when acting from a mirror
    const targetCardId = card.mirrorOf ?? cardId;
    if (card.isTemplate) {
      // If it's already a template, remove template status (applies to original and all mirrors)
      removeCardTemplate({ cardId: targetCardId });
    } else {
      // If it's not a template, make it one (applies to original and all mirrors)
      makeCardTemplate({ cardId: targetCardId });
    }
    onClose();
  }, [card, cardId, removeCardTemplate, makeCardTemplate, onClose]);

  // Use the modal click outside hook
  useModalClickOutside({
    isOpen,
    onClose,
    modalRef,
    buttonRef,
  });

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmDeleteOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoin = () => {
    if (card) {
      if (card.joined) {
        leaveCard({ cardId });
      } else {
        joinCard({ cardId });
      }
    }
    onClose();
  };

  const handleMove = () => {
    onClose();
    onOpenMoveModal?.();
  };

  const handleCopy = () => {
    onClose();
    onOpenCopyModal?.();
  };

  const handleMirror = () => {
    onClose();
    onOpenMirrorModal?.();
  };

  const handleWatch = () => {
    if (card) {
      toggleCardWatch({ cardId });
    }
    // Don't close modal so user can see the watch state change immediately
  };

  const handleShare = () => {
    // TODO: Implement share modal
    onClose();
  };

  const handleArchive = () => {
    if (!card?.archived) {
      // Don't actually archive the card yet - just set pending state
      // The card will be archived when the modal closes (if still pending)
      onSetPendingArchive?.();
      // Don't close the modal - let the user see the archive timestamp and restore/delete options
    }
  };

  const handleRestore = () => {
    if (card?.archived) {
      // Card is actually archived - unarchive it
      unarchiveCard({ cardId });
    } else if (pendingArchiveTimestamp) {
      // Card is pending archive - just clear the pending state
      onClearPendingArchive?.();
    }
    onClose();
  };

  const handleDelete = () => {
    if (card?.archived || pendingArchiveTimestamp != null) {
      setIsConfirmDeleteOpen(true);
      return;
    }

    if (card) {
      deleteCard({ cardId });
    }
    onClose();
  };

  if (isConfirmDeleteOpen) {
    return (
      <ConfirmDeleteCardModal
        isOpen={isOpen && isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          onClose();
        }}
        onConfirmDelete={() => {
          if (card) {
            deleteCard({ cardId });
          }
          setIsConfirmDeleteOpen(false);
          onClose();
        }}
        buttonRef={buttonRef}
        placement="bottom-start"
        lockOnOpen={true}
        onBack={() => setIsConfirmDeleteOpen(false)}
      />
    );
  }

  return (
    <ModalContainer
      ref={modalRef}
      variant="popover"
      className={`w-56 ${modalHeight.modalClasses} ${modalHeight.modalContainerClasses}`}
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '461px',
      }}
      data-card-action-modal
    >
      <div className={`py-2 ${modalHeight.contentClasses}`}>
        <ul>
          {/* Join - hide for inbox variant */}
          {variant === 'normal' && (
            <li>
              <MenuButton
                onClick={handleJoin}
                disabled={isOnlyHotkeys}
                shortcut="Space"
                tooltipContent={card?.joined ? 'Leave' : 'Join'}
              >
                {card?.joined ? (
                  <>
                    <IconLeave className="h-4 w-4 text-gray-600" />
                    Leave
                  </>
                ) : (
                  <>
                    <IconJoin className="h-4 w-4 text-gray-600" />
                    Join
                  </>
                )}
              </MenuButton>
            </li>
          )}

          {/* Move */}
          <li>
            <MenuButton onClick={handleMove} data-testid="card-back-move-card-button">
              <IconMove className="h-4 w-4 text-gray-600" />
              Move
            </MenuButton>
          </li>

          {/* Copy */}
          <li>
            <MenuButton onClick={handleCopy} data-testid="card-back-copy-card-button">
              <IconCopy className="h-4 w-4 text-gray-600" />
              Copy
            </MenuButton>
          </li>

          {/* Mirror - hide for inbox variant */}
          {variant === 'normal' && (
            <li>
              <MenuButton onClick={handleMirror} data-testid="card-back-mirror-card-button">
                <IconMirror className="h-4 w-4 text-gray-600" />
                Mirror
              </MenuButton>
            </li>
          )}

          {/* Template toggle - hide for inbox variant */}
          {variant === 'normal' && (
            <li className="relative">
              <MenuButton
                onClick={handleToggleTemplate}
                data-testid="card-back-make-template-button"
              >
                <IconMakeTemplate className="h-4 w-4 text-gray-600" />
                {card?.isTemplate ? 'Template' : 'Make template'}
              </MenuButton>
              {/* Green checkmark for template cards - right aligned with template button */}
              {card?.isTemplate && (
                <div className={checkmarkContainerClasses}>
                  <div className={checkmarkBoxClasses}>
                    <IconCheckmark className={checkmarkIconClasses} />
                  </div>
                </div>
              )}
            </li>
          )}

          {/* Watch - show for normal variant only before divider */}
          {variant === 'normal' && (
            <li className="relative">
              <MenuButton
                onClick={handleWatch}
                data-testid="card-back-subscribed-button"
                disabled={isOnlyHotkeys}
                shortcut="s"
                tooltipContent="Watch"
              >
                <IconWatch className="h-4 w-4 text-gray-600" />
                Watch
              </MenuButton>
              {/* Green checkmark for watched cards - right aligned with watch button */}
              {card?.watched && (
                <div className={checkmarkContainerClasses}>
                  <div className={checkmarkBoxClasses}>
                    <IconCheckmark className={checkmarkIconClasses} />
                  </div>
                </div>
              )}
            </li>
          )}

          {/* Divider */}
          <li className="my-1.5 border-t border-gray-200" />

          {/* Share - hide for inbox variant */}
          {variant === 'normal' && (
            <li>
              <MenuButton onClick={handleShare} data-testid="card-back-share-button">
                <IconShare className="h-4 w-4 text-gray-600" />
                Share
              </MenuButton>
            </li>
          )}

          {/* Archive or Restore/Delete */}
          {!card?.archived && !pendingArchiveTimestamp ? (
            <li>
              <MenuButton
                onClick={handleArchive}
                data-testid="card-back-archive-button"
                disabled={isOnlyHotkeys}
                shortcut="c"
                tooltipContent={card?.isTemplate ? 'Hide from list' : 'Archive'}
              >
                <IconArchive className="h-4 w-4 text-gray-600" />
                {card?.isTemplate ? 'Hide from list' : 'Archive'}
              </MenuButton>
            </li>
          ) : (
            <>
              {/* Restore */}
              <li>
                <MenuButton onClick={handleRestore} data-testid="card-back-restore-button">
                  <IconRestore className="h-4 w-4 text-gray-600" />
                  Restore
                </MenuButton>
              </li>

              {/* Delete */}
              <li>
                <MenuButton onClick={handleDelete} data-testid="card-back-delete-button">
                  <IconDelete className="h-4 w-4 text-gray-600" />
                  Delete
                </MenuButton>
              </li>
            </>
          )}

          {/* Watch - show for inbox variant after archive */}
          {variant === 'inbox' && (
            <li className="relative">
              <MenuButton
                onClick={handleWatch}
                data-testid="card-back-subscribed-button"
                disabled={isOnlyHotkeys}
                shortcut="s"
                tooltipContent="Watch"
              >
                <IconWatch className="h-4 w-4 text-gray-600" />
                Watch
              </MenuButton>
              {/* Green checkmark for watched cards - right aligned with watch button */}
              {card?.watched && (
                <div className={checkmarkContainerClasses}>
                  <div className={checkmarkBoxClasses}>
                    <IconCheckmark className={checkmarkIconClasses} />
                  </div>
                </div>
              )}
            </li>
          )}
        </ul>
      </div>
    </ModalContainer>
  );
});

export { CardModalAction };
