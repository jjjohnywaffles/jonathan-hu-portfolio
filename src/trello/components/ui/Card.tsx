import React, { memo, forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost' | 'interactive';
type CardSize = 'sm' | 'md' | 'lg';

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(function Card(
    {
      children,
      variant = 'default',
      size = 'md',
      className,
      header,
      footer,
      hoverable = false,
      clickable = false,
      selected = false,
      ...props
    },
    ref
  ) {
    const baseClasses = cn(
      'rounded-lg transition-all duration-200',
      'focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2',
      hoverable && 'transform hover:-translate-y-0.5 hover:shadow-md',
      clickable && 'cursor-pointer select-none',
      selected && 'ring-2 ring-blue-500 ring-offset-2'
    );

    const variantClasses = {
      default: 'bg-white border border-gray-200 shadow-sm',
      elevated: 'bg-white shadow-md hover:shadow-lg',
      outlined: 'bg-white border-2 border-gray-300',
      ghost: 'bg-transparent',
      interactive:
        'bg-white border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md',
    };

    const sizeClasses = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {header && <div className="mb-3 border-b border-gray-100 pb-3">{header}</div>}

        <div className="flex-1">{children}</div>

        {footer && <div className="mt-3 border-t border-gray-100 pt-3">{footer}</div>}
      </div>
    );
  })
);

export { Card };
export type { CardProps, CardVariant, CardSize };
