// Reusable action button component with variants for consistent rectangular buttons with borders across the Trello interface
import React, { memo, forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type ActionButtonProps = {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const ActionButton = memo(
  forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
    { children, variant = 'default', size = 'md', className, ...props },
    ref
  ) {
    const baseClasses =
      'flex items-center gap-1 rounded-sm border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400';

    const variantClasses = {
      default: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100',
      primary: 'border-blue-600 text-white bg-blue-600 hover:bg-blue-700',
      secondary: 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100',
    };

    const sizeClasses = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2 py-1 text-sm',
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

export { ActionButton };
