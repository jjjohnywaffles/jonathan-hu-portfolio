import React, { memo } from 'react';
import type { FC } from 'react';

type IconTextProps = {
  className?: string;
};

const IconText: FC<IconTextProps> = memo(function IconText({ className = '' }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 5H5V8H7V7H11V18H10V20H14V18H13V7H17V8H19V5H18H17H7H6Z"
        fill="currentColor"
      />
    </svg>
  );
});

export { IconText };
