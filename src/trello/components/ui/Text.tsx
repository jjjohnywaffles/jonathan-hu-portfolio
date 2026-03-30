// Typography component with variants (body, caption, label, link) for consistent text styling and semantic markup
import React, { memo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type TextProps = {
  children: ReactNode;
  variant?: 'body' | 'caption' | 'label' | 'link';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
} & HTMLAttributes<HTMLSpanElement>;

const Text = memo(function Text({
  children,
  variant = 'body',
  size = 'sm',
  className,
  ...props
}: TextProps) {
  const baseClasses = 'text-gray-600';

  const variantClasses = {
    body: 'text-gray-600',
    caption: 'text-gray-500',
    label: 'font-semibold text-gray-600 uppercase',
    link: 'text-gray-700 underline hover:text-gray-900 transition-colors cursor-pointer',
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
  };

  const Component = variant === 'link' ? 'button' : 'span';

  return (
    <Component
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
});

export { Text };
