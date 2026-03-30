import { useCallback } from 'react';
import { useTrelloUI } from '../components/TrelloUIContext';

export function useBoardDragScroll() {
  const { isDragging, startX, scrollLeft, setDragState } = useTrelloUI();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only start dragging if clicking on empty space (not on lists or cards)
      const target = e.target as HTMLElement;
      if (target.closest('.list-container') || target.closest('.card-container')) {
        return;
      }

      const currentTarget = e.currentTarget as HTMLElement;
      setDragState(true, e.pageX - currentTarget.offsetLeft, currentTarget.scrollLeft);
    },
    [setDragState]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      e.preventDefault();
      const currentTarget = e.currentTarget as HTMLElement;
      const x = e.pageX - currentTarget.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      currentTarget.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(false);
  }, [setDragState]);

  const handleMouseLeave = useCallback(() => {
    setDragState(false);
  }, [setDragState]);

  return {
    isDragging,
    dragScrollHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
