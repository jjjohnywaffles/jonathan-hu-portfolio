import { memo } from 'react';
import type { FC } from 'react';

type IconReorderProps = {
  className?: string;
};

const IconReorder: FC<IconReorderProps> = memo(function IconReorder({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor" fillRule="evenodd">
        <circle cx="9" cy="7" r="2"></circle>
        <circle cx="15" cy="7" r="2"></circle>
        <circle cx="9" cy="12" r="2"></circle>
        <circle cx="15" cy="12" r="2"></circle>
        <circle cx="9" cy="17" r="2"></circle>
        <circle cx="15" cy="17" r="2"></circle>
      </g>
    </svg>
  );
});

export { IconReorder };
