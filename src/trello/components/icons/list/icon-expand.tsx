import { memo } from 'react';
import type { FC } from 'react';

type IconExpandProps = {
  className?: string;
};

const IconExpand: FC<IconExpandProps> = memo(function IconExpand({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      aria-label="Expand list"
      fill="currentColor"
      role="presentation"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m.22 7.47 3.5-3.5 1.06 1.06-2.22 2.22H7v1.5H2.56l2.22 2.22-1.06 1.06-3.5-3.5a.75.75 0 0 1 0-1.06m13.22-.22-2.22-2.22 1.06-1.06 3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5-1.06-1.06 2.22-2.22H9v-1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
});

export { IconExpand };
