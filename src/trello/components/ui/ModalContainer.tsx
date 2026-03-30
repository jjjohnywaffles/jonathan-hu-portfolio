// Container component for modals and popovers with consistent border, shadow, and positioning variants
import React, { memo, forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type ModalContainerProps = {
  children: ReactNode;
  variant?: 'default' | 'popover' | 'large';
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const ModalContainer = memo(
  forwardRef<HTMLDivElement, ModalContainerProps>(function ModalContainer(
    { children, variant = 'default', className, ...props },
    ref
  ) {
    const baseClasses = 'rounded-lg border border-gray-200 bg-white shadow';

    const variantClasses = {
      default: 'shadow-lg',
      popover: 'shadow-xl fixed z-[60]',
      large: 'shadow-xl max-w-4xl',
    };

    return (
      <div ref={ref} className={cn(baseClasses, variantClasses[variant], className)} {...props}>
        {children}
      </div>
    );
  })
);

export { ModalContainer };
