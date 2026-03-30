import { useState, useCallback, useEffect, type RefObject } from 'react';
import { useTrelloOperations, useCardList } from '@trello/_lib/selectors';
import type { Card } from '@trello/_lib/types';

type DragMoveCardState = {
  pending: boolean;
  isDragging: boolean;
  cardId?: string;
  originalListId?: string;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
  dragOverListId?: string;
  insertIndex?: number;
};

type GhostCardProps = {
  top: string;
  left: string;
  width: string;
  height: string;
  title: string;
  opacity: number;
  transform: string;
  listId: string;
  insertIndex: number;
};

type UseDragToMoveCardProps = {
  boardRef: RefObject<HTMLDivElement | null>;
  listIds: string[];
  onDragStart?: (cardId: string) => void;
  onDragEnd?: (cardId: string) => void;
};

type UseDragToMoveCardReturn = {
  handleCardMouseDown: (card: Card, listId: string, e: React.MouseEvent) => void;
  getGhostCardProps: () => GhostCardProps | null;
  isCardBeingDragged: (cardId: string) => boolean;
  isDragging: boolean;
  dragOverListId: string | null;
  insertIndex: number | null;
};

/**
 * Advanced hook for drag-to-move card functionality
 * Provides sophisticated visual feedback and state management
 */
export function useDragToMoveCard({
  boardRef,
  listIds,
  onDragStart,
  onDragEnd,
}: UseDragToMoveCardProps): UseDragToMoveCardReturn {
  const { moveCard } = useTrelloOperations();
  const [dragState, setDragState] = useState<DragMoveCardState>({
    pending: false,
    isDragging: false,
  });

  // Find which list and position the mouse is currently over
  const getDropTarget = useCallback(
    (x: number, y: number) => {
      if (!boardRef.current) return null;

      const lists = boardRef.current.querySelectorAll('[data-list-id]');
      let targetListId: string | null = null;
      let insertIndex = 0;

      for (const listElement of lists) {
        const listRect = listElement.getBoundingClientRect();

        if (
          x >= listRect.left &&
          x <= listRect.right &&
          y >= listRect.top &&
          y <= listRect.bottom
        ) {
          targetListId = listElement.getAttribute('data-list-id');

          // Find insertion point within the list
          const cards = listElement.querySelectorAll('[data-card-id]');
          insertIndex = cards.length; // Default to end

          for (let i = 0; i < cards.length; i++) {
            const cardElement = cards[i];
            if (!cardElement) continue;
            const cardRect = cardElement.getBoundingClientRect();
            if (y < cardRect.top + cardRect.height / 2) {
              insertIndex = i;
              break;
            }
          }
          break;
        }
      }

      return targetListId ? { listId: targetListId, insertIndex } : null;
    },
    [boardRef]
  );

  // Handler for mousedown on a card
  const handleCardMouseDown = useCallback(
    (card: Card, listId: string, e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left mouse button

      e.preventDefault();
      e.stopPropagation();

      const cardElement = (e.target as HTMLElement).closest('[data-card-id]');
      const rect = cardElement?.getBoundingClientRect();
      if (!rect || !cardElement) return;

      setDragState({
        pending: true,
        isDragging: false,
        cardId: card.id,
        originalListId: listId,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });

      onDragStart?.(card.id);
    },
    [onDragStart]
  );

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.pending && !dragState.isDragging) return;

      const deltaX = Math.abs(e.clientX - (dragState.startX || 0));
      const deltaY = Math.abs(e.clientY - (dragState.startY || 0));

      // Start dragging if moved enough
      if (dragState.pending && (deltaX > 5 || deltaY > 5)) {
        setDragState((prev) => ({
          ...prev,
          pending: false,
          isDragging: true,
          currentX: e.clientX,
          currentY: e.clientY,
        }));
      }

      if (dragState.isDragging) {
        const dropTarget = getDropTarget(e.clientX, e.clientY);

        setDragState((prev) => ({
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
          dragOverListId: dropTarget?.listId,
          insertIndex: dropTarget?.insertIndex,
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.cardId) {
        setDragState({ pending: false, isDragging: false });
        return;
      }

      const dropTarget = getDropTarget(e.clientX, e.clientY);

      if (dropTarget && dragState.originalListId) {
        // Use moveCard for both same-list and cross-list moves to keep activity type consistent
        moveCard({
          cardId: dragState.cardId,
          targetListId: dropTarget.listId,
          targetIndex: dropTarget.insertIndex,
          sourceListId: dragState.originalListId,
        });
      }

      onDragEnd?.(dragState.cardId);
      setDragState({ pending: false, isDragging: false });
    };

    if (dragState.pending || dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return undefined;
  }, [dragState, getDropTarget, moveCard, onDragEnd]);

  // Generate ghost card props for rendering
  const getGhostCardProps = useCallback((): GhostCardProps | null => {
    if (!dragState.isDragging || !dragState.cardId || !dragState.currentX || !dragState.currentY) {
      return null;
    }

    const offsetX = (dragState.currentX || 0) - (dragState.startX || 0);
    const offsetY = (dragState.currentY || 0) - (dragState.startY || 0);

    return {
      top: `${(dragState.startY || 0) + offsetY}px`,
      left: `${(dragState.startX || 0) + offsetX}px`,
      width: '280px', // Standard card width
      height: 'auto',
      title: 'Moving card...', // Could be enhanced to show actual card title
      opacity: 0.8,
      transform: 'rotate(5deg)',
      listId: dragState.dragOverListId || '',
      insertIndex: dragState.insertIndex || 0,
    };
  }, [dragState]);

  // Check if a specific card is being dragged
  const isCardBeingDragged = useCallback(
    (cardId: string) => {
      return dragState.isDragging && dragState.cardId === cardId;
    },
    [dragState]
  );

  return {
    handleCardMouseDown,
    getGhostCardProps,
    isCardBeingDragged,
    isDragging: dragState.isDragging,
    dragOverListId: dragState.dragOverListId || null,
    insertIndex: dragState.insertIndex || null,
  };
}
