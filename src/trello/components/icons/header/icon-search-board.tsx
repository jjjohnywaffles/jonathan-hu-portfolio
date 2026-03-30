import type { FC } from 'react';

type IconSearchBoardProps = {
  className?: string;
  color?: string;
};

const IconSearchBoard: FC<IconSearchBoardProps> = ({ className = '', color = '#0079BF' }) => {
  return <div className={`h-6 w-6 rounded-sm ${className}`} style={{ backgroundColor: color }} />;
};

export { IconSearchBoard };
