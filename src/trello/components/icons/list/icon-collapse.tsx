import { memo } from 'react';
import type { FC } from 'react';

type IconCollapseProps = {
  className?: string;
};

const IconCollapse: FC<IconCollapseProps> = memo(function IconCollapse({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      aria-label="Collapse list"
      fill="currentColor"
      role="presentation"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.19 8.75H0v-1.5h5.19v1.5zm5.62-1.5H16v1.5h-5.19v-1.5z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.19 8 2.22 5.03l1.06-1.06 3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5-1.06-1.06zm4.03-.53 3.5-3.5 1.06 1.06L10.81 8l2.97 2.97-1.06 1.06-3.5-3.5a.75.75 0 0 1 0-1.06"
        clipRule="evenodd"
      />
    </svg>
  );
});

export { IconCollapse };
