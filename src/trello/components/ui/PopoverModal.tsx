// Positioned popover modal component with smooth animations and viewport-aware positioning for card modal interactions
import React, { memo, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type PopoverModalProps = {
  children: ReactNode;
  isOpen: boolean;
  position: { top: number; left: number };
  className?: string;
  containerClassName?: string;
  usePortal?: boolean;
  portalContainer?: Element | null;
} & HTMLAttributes<HTMLDivElement>;

const PopoverModal = memo(
  forwardRef<HTMLDivElement, PopoverModalProps>(function PopoverModal(
    {
      children,
      isOpen,
      position,
      className,
      containerClassName,
      usePortal = false,
      portalContainer,
      ...props
    },
    ref
  ) {
    const baseClasses =
      'absolute w-80 rounded-lg border border-gray-300 bg-white shadow-xl flex flex-col overflow-visible';

    const node = (
      <div
        ref={ref}
        className={cn(baseClasses, 'fixed z-50', containerClassName, className)}
        style={{
          top: position.top,
          left: position.left,
          opacity: isOpen && position.top >= 0 ? 1 : 0,
          transform: isOpen && position.top >= 0 ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          visibility: position.top >= 0 ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );

    if (usePortal && typeof document !== 'undefined') {
      return createPortal(node, portalContainer ?? document.body);
    }
    return node;
  })
);

export { PopoverModal };
