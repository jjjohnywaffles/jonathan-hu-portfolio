import React, { memo } from 'react';
import type { FC } from 'react';

type IconActionsProps = {
  className?: string;
};

const IconActions: FC<IconActionsProps> = memo(function IconActions({ className = 'w-4 h-4' }) {
  return (
    <svg fill="none" viewBox="0 0 16 16" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0m6.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0M13 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0"
        clipRule="evenodd"
      />
    </svg>
  );
});

export { IconActions };
