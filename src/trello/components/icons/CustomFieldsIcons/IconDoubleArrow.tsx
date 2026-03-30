import { memo } from 'react';
import type { FC } from 'react';

type IconDoubleArrowProps = {
  className?: string;
};

const IconDoubleArrow: FC<IconDoubleArrowProps> = memo(function IconDoubleArrow({
  className = 'h-4 w-4',
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.005 8.187l-6.453 3.865a1 1 0 0 1-1.028-1.716l6.97-4.174a1 1 0 0 1 1.031.002l6.906 4.174a1 1 0 1 1-1.035 1.712l-6.39-3.863z"
        fill="currentColor"
      />
      <path
        d="M5.552 18.054a1 1 0 1 1-1.028-1.715l6.97-4.174a1 1 0 0 1 1.031.002l6.906 4.174a1 1 0 1 1-1.035 1.711l-6.39-3.862-6.454 3.864z"
        fill="currentColor"
      />
    </svg>
  );
});

export { IconDoubleArrow };
