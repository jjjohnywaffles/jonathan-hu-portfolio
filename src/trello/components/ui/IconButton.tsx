// Circular icon-only button component with hover states and size variants for header actions and modal controls
import React, { memo, forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type IconButtonProps = {
  children: ReactNode;
  variant?: 'default' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const IconButton = memo(
  forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { children, variant = 'default', size = 'md', className, ...props },
    ref
  ) {
    const baseClasses = 'rounded-full transition-colors focus:outline-none cursor-pointer';

    const variantClasses = {
      default: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
      ghost: 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
      primary: 'text-white bg-blue-600 hover:bg-blue-700',
    };

    const sizeClasses = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  })
);

export { IconButton };
