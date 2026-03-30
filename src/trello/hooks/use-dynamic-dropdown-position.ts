import { useState, useEffect, useCallback } from 'react';

type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-center';

type UseDynamicDropdownPositionProps = {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
  preferredPosition?: DropdownPosition;
  offset?: number;
  viewportPadding?: number;
};

type CalculatedPosition = {
  top: number;
  left: number;
  position: DropdownPosition;
};

export function useDynamicDropdownPosition({
  isOpen,
  triggerRef,
  contentRef,
  preferredPosition = 'bottom-left',
  offset = 4,
  viewportPadding = 16,
}: UseDynamicDropdownPositionProps) {
  const [calculatedPosition, setCalculatedPosition] = useState<CalculatedPosition>({
    top: -9999,
    left: -9999,
    position: preferredPosition,
  });

  const calculateOptimalPosition = useCallback((): CalculatedPosition => {
    if (!triggerRef.current || !isOpen) {
      return { top: -9999, left: -9999, position: preferredPosition };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Estimate dropdown dimensions (will be refined after first render)
    const contentElement = contentRef.current;
    let dropdownHeight = 200; // Default fallback
    let dropdownWidth = 200; // Default fallback

    if (contentElement) {
      const contentRect = contentElement.getBoundingClientRect();
      dropdownHeight = contentRect.height || dropdownHeight;
      dropdownWidth = contentRect.width || dropdownWidth;
    }

    // Calculate positions for each possible placement
    const positions = {
      'bottom-left': {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerRect.left + scrollX,
      },
      'bottom-right': {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerRect.right + scrollX - dropdownWidth,
      },
      'top-left': {
        top: triggerRect.top + scrollY - dropdownHeight - offset,
        left: triggerRect.left + scrollX,
      },
      'top-right': {
        top: triggerRect.top + scrollY - dropdownHeight - offset,
        left: triggerRect.right + scrollX - dropdownWidth,
      },
      'bottom-center': {
        top: triggerRect.bottom + scrollY + offset,
        left: triggerRect.left + scrollX + (triggerRect.width - dropdownWidth) / 2,
      },
    };

    // Check which positions fit within the viewport
    const fitsInViewport = (pos: { top: number; left: number }) => {
      const topInViewport = pos.top - scrollY >= viewportPadding;
      const bottomInViewport =
        pos.top - scrollY + dropdownHeight <= viewportHeight - viewportPadding;
      const leftInViewport = pos.left - scrollX >= viewportPadding;
      const rightInViewport = pos.left - scrollX + dropdownWidth <= viewportWidth - viewportPadding;

      return {
        fitsVertically: topInViewport && bottomInViewport,
        fitsHorizontally: leftInViewport && rightInViewport,
        fits: topInViewport && bottomInViewport && leftInViewport && rightInViewport,
      };
    };

    // Priority order: try preferred position first, then alternatives
    const positionPriority: DropdownPosition[] = [
      preferredPosition,
      'bottom-left',
      'bottom-right',
      'top-left',
      'top-right',
      'bottom-center',
    ];

    // Remove duplicates
    const uniquePositions = [...new Set(positionPriority)];

    // Find the best position that fits
    for (const positionKey of uniquePositions) {
      const pos = positions[positionKey];
      const fit = fitsInViewport(pos);

      if (fit.fits) {
        return {
          top: pos.top,
          left: pos.left,
          position: positionKey,
        };
      }
    }

    // If nothing fits perfectly, use preferred position but adjust for viewport
    const finalPos = positions[preferredPosition];

    // Adjust horizontal position to fit
    if (finalPos.left - scrollX + dropdownWidth > viewportWidth - viewportPadding) {
      finalPos.left = scrollX + viewportWidth - dropdownWidth - viewportPadding;
    }
    if (finalPos.left - scrollX < viewportPadding) {
      finalPos.left = scrollX + viewportPadding;
    }

    // Adjust vertical position to fit
    if (finalPos.top - scrollY + dropdownHeight > viewportHeight - viewportPadding) {
      // Try flipping to top
      const topPos = triggerRect.top + scrollY - dropdownHeight - offset;
      if (topPos - scrollY >= viewportPadding) {
        finalPos.top = topPos;
      } else {
        // Keep at bottom but adjust
        finalPos.top = scrollY + viewportHeight - dropdownHeight - viewportPadding;
      }
    }
    if (finalPos.top - scrollY < viewportPadding) {
      finalPos.top = scrollY + viewportPadding;
    }

    return {
      top: finalPos.top,
      left: finalPos.left,
      position: preferredPosition,
    };
  }, [isOpen, triggerRef, contentRef, preferredPosition, offset, viewportPadding]);

  // Calculate position when dropdown opens or trigger moves
  useEffect(() => {
    if (isOpen) {
      function updatePosition() {
        const newPosition = calculateOptimalPosition();
        setCalculatedPosition(newPosition);
      }

      // Initial calculation
      updatePosition();

      // Recalculate on scroll/resize
      function handleUpdate() {
        requestAnimationFrame(updatePosition);
      }

      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);

      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
    return undefined;
  }, [isOpen, calculateOptimalPosition]);

  // Also recalculate when content dimensions change
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        const newPosition = calculateOptimalPosition();
        setCalculatedPosition(newPosition);
      });

      resizeObserver.observe(contentRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
    return undefined;
  }, [isOpen, calculateOptimalPosition, contentRef]);

  return calculatedPosition;
}
