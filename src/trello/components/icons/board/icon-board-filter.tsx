import React from 'react';

type IconBoardFilterProps = {
  className?: string;
};

export const IconBoardFilter: React.FC<IconBoardFilterProps> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M15 3.5H1V2h14zm-2 5.25H3v-1.5h10zM11 14H5v-1.5h6z"
        clipRule="evenodd"
      />
    </svg>
  );
};
