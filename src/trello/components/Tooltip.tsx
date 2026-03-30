import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
  cloneElement,
  isValidElement,
} from 'react';
import type { FC, ReactNode, ReactElement } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  children: ReactNode;
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'bottom-center' | 'left' | 'right' | 'right-modal';
  delay?: number;
  variant?: 'dark' | 'light';
  fullWidth?: boolean;
};

const Tooltip: FC<TooltipProps> = memo(function Tooltip({
  children,
  content,
  shortcut,
  position = 'bottom',
  delay = 500,
  variant = 'dark',
  fullWidth = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;

    // Get the first child element for positioning (handles absolute positioned children)
    const triggerElement = wrapperRef.current.firstElementChild || wrapperRef.current;
    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    // Calculate position based on the specified position prop
    const TOOLTIP_GAP = 8; // Consistent gap for all positions

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - TOOLTIP_GAP;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + TOOLTIP_GAP;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom-center':
        top = triggerRect.bottom + TOOLTIP_GAP;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - TOOLTIP_GAP;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + TOOLTIP_GAP;
        break;
      case 'right-modal': {
        // Find the closest modal container and position tooltip to its right
        const modalContainer = wrapperRef.current?.closest(
          '[data-add-to-card-modal], [data-card-action-modal]'
        );
        if (modalContainer) {
          const modalRect = modalContainer.getBoundingClientRect();
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = modalRect.right + TOOLTIP_GAP;
        } else {
          // Fallback to regular right positioning
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + TOOLTIP_GAP;
        }
        break;
      }
    }

    // Simple viewport boundary check - only prevent going off screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Clamp to viewport edges
    left = Math.max(0, Math.min(left, viewportWidth - tooltipRect.width));
    top = Math.max(0, Math.min(top, viewportHeight - tooltipRect.height));

    setTooltipPosition({ top, left });
  }, [position]);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Calculate position whenever tooltip becomes visible
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isVisible, calculatePosition]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, calculatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipClasses = `
    fixed z-[9999] px-2 py-0.5 text-xs font-normal rounded 
    whitespace-nowrap pointer-events-none transition-opacity duration-200
    ${variant === 'light' ? 'text-black bg-white shadow-lg' : 'text-white bg-black'}
  `;

  const tooltipStyle = {
    top: `${tooltipPosition.top}px`,
    left: `${tooltipPosition.left}px`,
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? ('visible' as const) : ('hidden' as const),
    backgroundColor: variant === 'light' ? '#ffffff' : '#000000',
  };

  // Check if the child element is absolutely positioned
  const childElement = React.Children.only(children) as ReactElement<{
    className?: string;
  }>;
  const isAbsoluteChild = childElement?.props?.className?.includes('absolute');
  const wrapperStyle = {
    display: isAbsoluteChild
      ? ('contents' as const)
      : fullWidth
        ? ('block' as const)
        : ('inline-flex' as const),
    position: isAbsoluteChild ? undefined : ('relative' as const),
    width: fullWidth && !isAbsoluteChild ? '100%' : undefined,
    alignItems: isAbsoluteChild || fullWidth ? undefined : ('center' as const),
    justifyContent: isAbsoluteChild || fullWidth ? undefined : ('center' as const),
  };

  return (
    <>
      <div
        ref={wrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={wrapperStyle}
      >
        {children}
      </div>
      {typeof window !== 'undefined' &&
        createPortal(
          <div ref={tooltipRef} className={tooltipClasses} style={tooltipStyle}>
            {content}
            {shortcut && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 font-mono text-xs font-semibold text-gray-800">
                {shortcut}
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  );
});

export { Tooltip };
