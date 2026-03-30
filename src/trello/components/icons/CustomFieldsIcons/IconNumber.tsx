import React, { memo } from 'react';
import type { FC } from 'react';

type IconNumberProps = {
  className?: string;
};

const IconNumber: FC<IconNumberProps> = memo(function IconNumber({ className = '' }) {
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
        d="M9 4C8.44772 4 8 4.44772 8 5V8H5C4.44772 8 4 8.44772 4 9C4 9.55229 4.44772 10 5 10H8V14H5C4.44772 14 4 14.4477 4 15C4 15.5523 4.44772 16 5 16H8V19C8 19.5523 8.44772 20 9 20C9.55228 20 10 19.5523 10 19V16L14 16V19C14 19.5523 14.4477 20 15 20C15.5523 20 16 19.5523 16 19V16H19C19.5523 16 20 15.5523 20 15C20 14.4477 19.5523 14 19 14H16V10H19C19.5523 10 20 9.55228 20 9C20 8.44771 19.5523 8 19 8H16V5C16 4.44772 15.5523 4 15 4C14.4477 4 14 4.44772 14 5V8L10 8V5C10 4.44772 9.55228 4 9 4ZM10 10V14L14 14V10L10 10Z"
        fill="currentColor"
      />
    </svg>
  );
});

export { IconNumber };
