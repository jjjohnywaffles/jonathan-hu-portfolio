import React, { memo } from 'react';
import type { FC } from 'react';

type IconSparkleProps = {
  className?: string;
};

const IconSparkle: FC<IconSparkleProps> = memo(function IconSparkle({ className = 'w-6 h-6' }) {
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
      <path d="M8 2L7 7L2 8L7 9L8 14L9 9L14 8L9 7L8 2Z" fill="currentColor" />
      <path d="M17 11L18 8L19 11L22 12L19 13L18 16L17 13L14 12L17 11Z" fill="currentColor" />
      <path d="M11 17L12 14L13 17L16 18L13 19L12 22L11 19L8 18L11 17Z" fill="currentColor" />
    </svg>
  );
});

export { IconSparkle };
