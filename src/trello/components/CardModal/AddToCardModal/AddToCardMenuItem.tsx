import React, { memo } from 'react';
import type { FC, ComponentType } from 'react';
import { Tooltip } from '../../Tooltip';
import { cn } from '@trello/_lib/shims/utils';

type AddToCardMenuItemProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  testId: string;
  ariaLabel?: string;
  disabled?: boolean;
  shortcut?: string;
};

const AddToCardMenuItem: FC<AddToCardMenuItemProps> = memo(function AddToCardMenuItem({
  icon: Icon,
  title,
  description,
  onClick,
  testId,
  ariaLabel,
  disabled = false,
  shortcut,
}) {
  const button = (
    <button
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:bg-gray-100 focus:outline-none',
        disabled && 'matrices-disabled'
      )}
      onClick={disabled ? undefined : onClick}
      data-testid={testId}
      aria-label={ariaLabel || title}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded border border-gray-300">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div className="ml-1 flex-1 px-2 py-1">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </button>
  );

  if (shortcut) {
    return (
      <li>
        <Tooltip
          content={title}
          shortcut={shortcut}
          position="right-modal"
          variant="dark"
          fullWidth
        >
          {button}
        </Tooltip>
      </li>
    );
  }

  return <li>{button}</li>;
});

export { AddToCardMenuItem };
