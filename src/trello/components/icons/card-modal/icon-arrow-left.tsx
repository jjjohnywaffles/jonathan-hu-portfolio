import React, { memo } from 'react';
import type { FC } from 'react';

type IconArrowLeftProps = {
  className?: string;
};

const IconArrowLeft: FC<IconArrowLeftProps> = memo(function IconArrowLeft({
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
        d="m1.22 7.47 5-5 1.06 1.06-3.72 3.72H15v1.5H3.56l3.72 3.72-1.06 1.06-5-5a.75.75 0 0 1 0-1.06"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
});

export { IconArrowLeft };
