import { useState, useEffect, useCallback, useRef } from 'react';
import type { Position, Size } from '../types/window';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseWindowResizeOptions {
  position: Position;
  size: Size;
  minWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onResize: (position: Position, size: Size) => void;
  enabled?: boolean;
}

interface UseWindowResizeReturn {
  isResizing: boolean;
  resizeDirection: ResizeDirection | null;
  handleResizeStart: (direction: ResizeDirection) => (e: React.MouseEvent) => void;
}

// Dock height constant - matches --spacing-dock-height in index.css
const DOCK_HEIGHT = 70;

export const useWindowResize = ({
  position,
  size,
  minWidth = 200,
  minHeight = 150,
  maxHeight,
  onResize,
  enabled = true,
}: UseWindowResizeOptions): UseWindowResizeReturn => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);

  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: size.width, height: size.height });
  const startWindowPosRef = useRef({ x: position.x, y: position.y });

  const handleResizeStart = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeDirection(direction);

      startPosRef.current = { x: e.clientX, y: e.clientY };
      startSizeRef.current = { width: size.width, height: size.height };
      startWindowPosRef.current = { x: position.x, y: position.y };
    },
    [enabled, size.width, size.height, position.x, position.y]
  );

  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      let newWidth = startSizeRef.current.width;
      let newHeight = startSizeRef.current.height;
      let newX = startWindowPosRef.current.x;
      let newY = startWindowPosRef.current.y;

      // Calculate max height based on dock position
      const effectiveMaxHeight = maxHeight ?? window.innerHeight - DOCK_HEIGHT;

      // Handle horizontal resizing
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, startSizeRef.current.width + deltaX);
      }
      if (resizeDirection.includes('w')) {
        const potentialWidth = startSizeRef.current.width - deltaX;
        if (potentialWidth >= minWidth) {
          newWidth = potentialWidth;
          newX = startWindowPosRef.current.x + deltaX;
        }
      }

      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        const potentialHeight = startSizeRef.current.height + deltaY;
        // Constrain: window top + height cannot exceed screen height - dock
        const maxAllowedHeight = effectiveMaxHeight - newY;
        newHeight = Math.max(minHeight, Math.min(potentialHeight, maxAllowedHeight));
      }
      if (resizeDirection.includes('n')) {
        const potentialHeight = startSizeRef.current.height - deltaY;
        if (potentialHeight >= minHeight) {
          const potentialY = startWindowPosRef.current.y + deltaY;
          // Don't allow resizing above viewport
          if (potentialY >= 0) {
            newHeight = potentialHeight;
            newY = potentialY;
          }
        }
      }

      onResize({ x: newX, y: newY }, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, minWidth, minHeight, maxHeight, onResize]);

  return {
    isResizing,
    resizeDirection,
    handleResizeStart,
  };
};
