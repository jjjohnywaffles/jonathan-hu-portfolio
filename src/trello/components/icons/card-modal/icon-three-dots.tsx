import React, { memo } from 'react';
import type { FC } from 'react';

type IconThreeDotsProps = {
  className?: string;
};

const IconThreeDots: FC<IconThreeDotsProps> = memo(function IconThreeDots({
  className = 'h-4 w-4',
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
  );
});

export { IconThreeDots };
