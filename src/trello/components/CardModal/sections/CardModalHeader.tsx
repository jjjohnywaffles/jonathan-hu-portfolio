import React, { memo } from 'react';
import type { FC } from 'react';
import { IconDown } from '../../icons/card-modal/icon-down';
import { IconClose } from '../../icons/card-modal/icon-close';
import { IconActions } from '../../icons/card-modal/icon-actions';
import IconWatch from '../../icons/card-modal/icon-watch';
import { IconButton, FlexContainer } from '../../ui';
import { Tooltip } from '../../Tooltip';
import type { Card, List } from '@trello/_lib/types';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';
import { cn } from '@trello/_lib/shims/utils';

type CardModalHeaderProps = {
  card: Card;
  currentList: List | undefined;
  onClose: () => void;
  // Customization props
  showMoveButton?: boolean;
  moveButtonRef?: React.RefObject<HTMLButtonElement>;
  onOpenMoveModal?: (triggerRef?: React.RefObject<HTMLButtonElement | null>) => void;
  // Actions button props
  actionButtonRef?: React.RefObject<HTMLButtonElement>;
  onOpenActionModal?: () => void;
  // Watch toggle handler
  onToggleWatch?: () => void;
  className?: string;
};

const CardModalHeader: FC<CardModalHeaderProps> = memo(function CardModalHeader({
  card,
  currentList,
  onClose,
  showMoveButton = true,
  moveButtonRef,
  onOpenMoveModal,
  actionButtonRef,
  onOpenActionModal,
  onToggleWatch,
  className = 'border-b border-gray-200 px-4 py-3',
}) {
  const isOnlyDragDrop = useIsModifierEnabled('onlyDragDrop');
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');

  return (
    <header className={className}>
      <FlexContainer justify="between">
        <FlexContainer gap="2">
          {/* Mirror card indicator - colored square and board title (for mirrored cards only) */}
          {card.isMirror && (
            <div
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-gray-100"
              title="This card is mirrored from Basic Board"
            >
              <div className="h-4 w-4 rounded" style={{ backgroundColor: '#0079bf' }} />
              <span className="text-sm font-medium text-gray-600">Basic Board</span>
            </div>
          )}

          {/* Move button or status indicator */}
          {currentList?.id === 'inbox' ? (
            <span className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600">
              IN YOUR INBOX
            </span>
          ) : showMoveButton && onOpenMoveModal ? (
            <button
              ref={moveButtonRef}
              className={`flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 ${isOnlyDragDrop ? 'matrices-disabled' : ''}`}
              title="Move card"
              onClick={isOnlyDragDrop ? undefined : () => onOpenMoveModal(moveButtonRef)}
            >
              <span>{currentList?.title ?? 'To-Do'}</span>
              <IconDown className="h-4 w-4" />
            </button>
          ) : (
            <span className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600">
              {currentList?.title ?? 'To-Do'}
            </span>
          )}
        </FlexContainer>

        {/* Right side buttons */}
        <FlexContainer gap="2">
          {/* Watch indicator - only show if card is watched */}
          {card.watched && onToggleWatch && (
            <Tooltip content="Stop watching card" shortcut="s" position="top" variant="dark">
              <IconButton
                onClick={isOnlyHotkeys ? undefined : onToggleWatch}
                aria-label="Stop watching card"
                size="sm"
                className={cn('text-gray-500', isOnlyHotkeys && 'matrices-disabled')}
              >
                <IconWatch className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          )}

          {/* Actions button - disabled when onlyDragDrop modifier is active */}
          {onOpenActionModal && (
            <Tooltip content="Actions" position="top" variant="dark">
              <IconButton
                ref={actionButtonRef}
                onClick={isOnlyDragDrop ? undefined : onOpenActionModal}
                aria-label="Actions"
                size="sm"
                className={isOnlyDragDrop ? 'matrices-disabled' : undefined}
              >
                <IconActions className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          )}

          {/* Close button */}
          <Tooltip content="Close" position="top" variant="dark">
            <IconButton onClick={onClose} aria-label="Close modal" size="sm">
              <IconClose className="h-5 w-5" />
            </IconButton>
          </Tooltip>
        </FlexContainer>
      </FlexContainer>
    </header>
  );
});

export { CardModalHeader };
