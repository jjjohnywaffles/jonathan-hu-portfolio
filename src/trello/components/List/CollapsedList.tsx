import React, { memo, useState } from 'react';
import type { FC } from 'react';
import { Tooltip } from '../Tooltip';
import { IconExpand } from '../icons/list/icon-expand';
import { useList, useFilteredListCardCount, useTrelloOperations } from '@trello/_lib/selectors';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';
import { cn } from '@trello/_lib/shims/utils';

type CollapsedListProps = {
  listId: string;
  dragHandleProps?: any;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
};

const CollapsedList: FC<CollapsedListProps> = memo(function CollapsedList({
  listId,
  dragHandleProps,
  isHovered: propIsHovered,
  onHoverChange,
}) {
  const list = useList(listId);
  const { expandList } = useTrelloOperations();
  const cardCount = useFilteredListCardCount(listId);
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');

  // Use prop hover state if provided, otherwise use local state
  const [localIsHovered, setLocalIsHovered] = useState(false);
  const isHovered = propIsHovered ?? localIsHovered;

  const handleExpand = () => {
    expandList({ listId });
  };

  if (!list) return null;

  return (
    <div
      className={cn(
        'flex max-h-[calc(100dvh-168px)] w-11 flex-shrink-0 cursor-pointer flex-col items-center justify-start rounded-2xl bg-gray-100 px-2 py-3 transition-colors hover:bg-gray-200',
        list.isDraggable === false && 'opacity-90 ring-1 ring-gray-300',
        isOnlyHotkeys && 'matrices-disabled'
      )}
      onClick={isOnlyHotkeys ? undefined : handleExpand}
      onMouseEnter={() => {
        if (onHoverChange) {
          onHoverChange(true);
        } else {
          setLocalIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (onHoverChange) {
          onHoverChange(false);
        } else {
          setLocalIsHovered(false);
        }
      }}
      {...(dragHandleProps && list.isDraggable !== false ? dragHandleProps : {})}
    >
      {/* Expand icon at the top with tooltip */}
      <Tooltip content="Expand list" shortcut="\" position="bottom">
        <div
          className="mb-1 flex h-6 w-6 items-center justify-center text-gray-500"
          aria-label="Expand list"
        >
          <IconExpand className="h-4 w-4" />
        </div>
      </Tooltip>

      {/* Vertical text and card count */}
      <div className="flex flex-col items-center gap-2 select-none">
        <div
          className="text-sm font-semibold text-gray-800 [writing-mode:vertical-lr]"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {list.title}
        </div>
        {/* Card count without bubble */}
        <div className="pb-1 text-xs font-medium text-gray-600">{cardCount}</div>
      </div>
    </div>
  );
});

export { CollapsedList };
