import { type FC, memo } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type IconTrashProps = {
  className?: string;
};

export const IconTrash: FC<IconTrashProps> = memo(function IconTrash({ className }) {
  return (
    <svg
      className={cn(`h-4 w-4`, className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
  );
});
