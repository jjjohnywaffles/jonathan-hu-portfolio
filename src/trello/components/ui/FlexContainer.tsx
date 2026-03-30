// Flexible layout component that eliminates repetitive flex className patterns by providing configurable direction, alignment, justification, and gap properties
import React, { memo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type FlexContainerProps = {
  children: ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: '1' | '2' | '3' | '4' | '6';
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const FlexContainer = memo(function FlexContainer({
  children,
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = '2',
  className,
  ...props
}: FlexContainerProps) {
  const baseClasses = 'flex';

  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const gapClasses = {
    '1': 'gap-1',
    '2': 'gap-2',
    '3': 'gap-3',
    '4': 'gap-4',
    '6': 'gap-6',
  };

  return (
    <div
      className={cn(
        baseClasses,
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export { FlexContainer };
