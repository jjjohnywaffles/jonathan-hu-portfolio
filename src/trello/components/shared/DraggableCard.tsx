import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '../CardModal/Card';
import type { Card as CardType } from '@trello/_lib/types';

type DraggableCardProps = {
  card: CardType;
  listId: string;
  actualIndex: number;
  isDisabled: boolean;
};

const DraggableCard: React.FC<DraggableCardProps> = memo(function DraggableCard({
  card,
  listId,
  actualIndex,
  isDisabled,
}) {
  const draggableId = `${listId}-${card.id}-${card.isMirror ? 'mirror' : 'card'}`;

  return (
    <Draggable draggableId={draggableId} index={actualIndex} isDragDisabled={isDisabled}>
      {(dragProvided, dragSnapshot) => {
        const isActiveDrag = dragSnapshot.isDragging && !dragSnapshot.isDropAnimating;

        return (
          <div
            ref={dragProvided.innerRef}
            {...dragProvided.draggableProps}
            {...(!isDisabled ? dragProvided.dragHandleProps : {})}
            style={{
              ...dragProvided.draggableProps.style,
              opacity: isActiveDrag ? 0.7 : 1,
              transform: isActiveDrag
                ? `${dragProvided.draggableProps.style?.transform} rotate(3deg)`
                : dragProvided.draggableProps.style?.transform,
            }}
            className={dragSnapshot.isDragging ? 'z-50' : ''}
          >
            <Card card={card} listId={listId} />
          </div>
        );
      }}
    </Draggable>
  );
});

export { DraggableCard };
