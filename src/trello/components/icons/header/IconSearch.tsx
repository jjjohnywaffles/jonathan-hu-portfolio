import React, { memo } from 'react';

const IconSearch: React.FC<{ className?: string }> = memo(function IconSearch({ className = '' }) {
  return (
    <svg
      className={`h-4 w-4 text-gray-500 ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m16.436 15.085 3.94 4.01a1 1 0 0 1-1.425 1.402l-3.938-4.006a7.5 7.5 0 1 1 1.423-1.406M10.5 16a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11"
      />
    </svg>
  );
});

export { IconSearch };
