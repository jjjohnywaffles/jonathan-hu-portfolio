// Full-width menu item button component for dropdown and popover menus with hover states and danger variant
import React, { memo, forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Tooltip } from '../Tooltip';
import { cn } from '@trello/_lib/shims/utils';

type MenuButtonProps = {
  children: ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
  shortcut?: string;
  tooltipContent?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const MenuButton = memo(
  forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton(
    { children, variant = 'default', className, disabled, shortcut, tooltipContent, ...props },
    ref
  ) {
    const baseClasses =
      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors focus:outline-none cursor-pointer';

    const variantClasses = {
      default: 'text-gray-700 hover:bg-gray-100',
      danger: 'text-red-700 hover:bg-red-50',
    };

    const button = (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          disabled && 'matrices-disabled',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );

    if (shortcut) {
      return (
        <Tooltip
          content={tooltipContent ?? ''}
          shortcut={shortcut}
          position="right-modal"
          variant="dark"
          fullWidth
        >
          {button}
        </Tooltip>
      );
    }

    return button;
  })
);

export { MenuButton };
