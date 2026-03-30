import { memo } from 'react';
import type { FC } from 'react';

type IconWatchProps = {
  className?: string;
};

const IconWatch: FC<IconWatchProps> = memo(function IconWatch({ className = 'h-4 w-4' }) {
  return (
    <svg fill="none" viewBox="0 0 16 16" role="presentation" className={className}>
      <path fill="currentColor" d="M5.75 8a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0"></path>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 2C4.433 2 1.319 4.232.167 7.38c-.146.4-.146.84 0 1.24C1.32 11.768 4.433 14 8 14c3.566 0 6.681-2.232 7.833-5.38.146-.4.146-.84 0-1.24C14.68 4.232 11.566 2 8 2m0 2.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5"
        clipRule="evenodd"
      ></path>
    </svg>
  );
});

export default IconWatch;
