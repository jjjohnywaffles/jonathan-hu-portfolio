import React from 'react';

type IconInboxProps = {
  className?: string;
};

export const IconInbox: React.FC<IconInboxProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2zm2-.5a.5.5 0 0 0-.5.5v5h3a.75.75 0 0 1 .75.75 1.75 1.75 0 1 0 3.5 0A.75.75 0 0 1 10.5 8h3V3a.5.5 0 0 0-.5-.5zm10.5 7h-2.337a3.251 3.251 0 0 1-6.326 0H2.5V13a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5zM12 6H4V4.5h8z"
        clipRule="evenodd"
      />
    </svg>
  );
};
