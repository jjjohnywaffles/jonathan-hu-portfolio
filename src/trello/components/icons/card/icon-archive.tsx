import { memo } from 'react';
import type { FC } from 'react';

type IconArchiveProps = {
  className?: string;
};

const IconArchive: FC<IconArchiveProps> = memo(function IconArchive({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
      />
    </svg>
  );
});

export { IconArchive };
