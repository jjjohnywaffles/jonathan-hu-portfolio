import React, { memo, useRef, useEffect, useState } from 'react';
import type { FC } from 'react';
import { IconJoin } from '../icons/card-modal-action/icon-join';
import { IconLeave } from '../icons/card-modal-action/icon-leave';
import { IconMove } from '../icons/card-modal-action/icon-move';
import { IconCopy } from '../icons/card-modal-action/icon-copy';
import { IconWatch } from '../icons/card-modal-action/icon-watch';
import { IconMakeTemplate } from '../icons/card-modal-action/icon-make-template';
import { IconShare } from '../icons/card-modal-action/icon-share';
import { IconCheckmark } from '../icons/card/icon-checkmark';
import { useModalClickOutside } from '../../hooks/use-modal-click-outside';
import { ModalContainer, MenuButton } from '../ui';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useCard, useTrelloOperations } from '@trello/_lib/selectors';

type MirrorCardActionProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenMoveModal: (triggerRef?: React.RefObject<HTMLButtonElement | null>) => void;
  onOpenCopyModal: () => void;
};

const MirrorCardAction: FC<MirrorCardActionProps> = memo(function MirrorCardAction({
  cardId,
  isOpen,
  onClose,
  buttonRef,
  onOpenMoveModal,
  onOpenCopyModal,
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const card = useCard(cardId);
  const { joinCard, leaveCard, toggleCardWatch, makeCardTemplate, removeCardTemplate } =
    useTrelloOperations();

  // Use the modal positioning hook with overflow detection
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 224,
    fallbackHeight: 461,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use the modal click outside hook
  useModalClickOutside({
    isOpen,
    onClose,
    modalRef,
    buttonRef,
  });

  if (!isOpen) return null;

  const handleJoinLeave = () => {
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
    onClose(); // Close the action modal first
    onOpenMoveModal(); // Then open the move modal
  };

  const handleCopy = () => {
    onClose(); // Close the action modal first
    onOpenCopyModal(); // Then open the copy modal
  };

  const handleWatch = () => {
    toggleCardWatch({ cardId });
    // Don't close modal so user can see the watch state change immediately
  };

  const handleToggleTemplate = () => {
    if (!card) {
      return;
    }
    const targetCardId = card.mirrorOf ?? cardId;
    if (card.isTemplate) {
      removeCardTemplate({ cardId: targetCardId });
    } else {
      makeCardTemplate({ cardId: targetCardId });
    }
    onClose();
  };

  const handleShare = () => {
    // No functionality yet
    onClose();
  };

  return (
    <ModalContainer
      ref={modalRef}
      variant="popover"
      className="w-56"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '461px',
      }}
    >
      <div className="py-2">
        <ul>
          {/* Join/Leave */}
          <li>
            <MenuButton onClick={handleJoinLeave}>
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

          {/* Move */}
          <li>
            <MenuButton onClick={handleMove}>
              <IconMove className="h-4 w-4 text-gray-600" />
              Move
            </MenuButton>
          </li>

          {/* Copy */}
          <li>
            <MenuButton onClick={handleCopy}>
              <IconCopy className="h-4 w-4 text-gray-600" />
              Copy
            </MenuButton>
          </li>

          {/* Watch */}
          <li className="relative">
            <MenuButton onClick={handleWatch}>
              <IconWatch className="h-4 w-4 text-gray-600" />
              Watch
            </MenuButton>
            {/* Green checkmark for watched cards - right aligned with watch button */}
            {card?.watched && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-green-500">
                  <IconCheckmark className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
          </li>

          {/* Template toggle (show for mirrored template cards to allow undo) */}
          {card?.isTemplate && (
            <li className="relative">
              <MenuButton onClick={handleToggleTemplate}>
                <IconMakeTemplate className="h-4 w-4 text-gray-600" />
                {card?.isTemplate ? 'Template' : 'Make template'}
              </MenuButton>
              {card?.isTemplate && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-green-500">
                    <IconCheckmark className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </li>
          )}

          {/* Divider */}
          <li className="mx-3 my-1.5 border-t border-gray-200" />

          {/* Share */}
          <li>
            <MenuButton onClick={handleShare}>
              <IconShare className="h-4 w-4 text-gray-600" />
              Share
            </MenuButton>
          </li>
        </ul>
      </div>
    </ModalContainer>
  );
});

export { MirrorCardAction };
