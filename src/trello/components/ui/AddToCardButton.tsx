import React, { memo } from 'react';
import type { FC } from 'react';
import { Button } from './Button';
import { cn } from '@trello/_lib/shims/utils';

// Reusable button component for "Add to Card" section
export type AddToCardButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  show?: boolean;
  className?: string;
  disabled?: boolean;
};

export const AddToCardButton: FC<AddToCardButtonProps> = memo(function AddToCardButton({
  icon: Icon,
  label,
  onClick,
  buttonRef,
  show = true,
  className,
  disabled = false,
}) {
  if (!show) return null;

  const addToCardButtonClass =
    'border border-gray-300 text-gray-700 px-2 py-1 text-sm font-medium flex items-center gap-1';
  const iconSmallClass = 'h-4 w-4';

  return (
    <Button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      onClick={disabled ? undefined : onClick}
      variant="ghost"
      className={cn(addToCardButtonClass, disabled && 'matrices-disabled', className)}
    >
      <Icon className={iconSmallClass} />
      {label}
    </Button>
  );
});
