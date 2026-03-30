import React, { memo } from 'react';
import type { FC } from 'react';

type IconChevronRightProps = {
  className?: string;
};

const IconChevronRight: FC<IconChevronRightProps> = memo(function IconChevronRight({ className }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.7071 12.7071L9.63606 19.7782C9.24554 20.1687 8.61237 20.1687 8.22185 19.7782C7.83133 19.3877 7.83133 18.7545 8.22185 18.364L14.5858 12L8.22185 5.63606C7.83132 5.24554 7.83132 4.61237 8.22185 4.22185C8.61237 3.83133 9.24554 3.83133 9.63606 4.22185L16.7071 11.2929C17.0977 11.6834 17.0977 12.3166 16.7071 12.7071Z"
        fill="currentColor"
      />
    </svg>
  );
});

export { IconChevronRight };
