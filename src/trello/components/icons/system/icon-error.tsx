import { type FC, memo } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type IconErrorProps = {
  className?: string;
};

export const IconError: FC<IconErrorProps> = memo(function IconError({ className }) {
  return (
    <svg
      className={cn(`h-5 w-5`, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
});
