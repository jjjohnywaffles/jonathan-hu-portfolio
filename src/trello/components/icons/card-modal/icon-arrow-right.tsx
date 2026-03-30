import React, { memo } from 'react';
import type { FC } from 'react';

type IconArrowRightProps = {
  className?: string;
};

const IconArrowRight: FC<IconArrowRightProps> = memo(function IconArrowRight({
  className = 'w-6 h-6',
}) {
  return (
    <svg
      width="24"
      height="24"
      role="presentation"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12.44 7.25 8.72 3.53l1.06-1.06 5 5a.75.75 0 0 1 0 1.06l-5 5-1.06-1.06 3.72-3.72H1v-1.5z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
});

export { IconArrowRight };
