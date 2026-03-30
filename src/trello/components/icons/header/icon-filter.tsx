import React, { memo } from 'react';
import type { FC, SVGProps } from 'react';

const IconFilter: FC<SVGProps<SVGSVGElement>> = memo(function IconFilter(props) {
  return (
    <svg fill="none" viewBox="0 0 16 16" role="presentation" {...props}>
      <path
        fill="currentcolor"
        fillRule="evenodd"
        d="M15 3.5H1V2h14zm-2 5.25H3v-1.5h10zM11 14H5v-1.5h6z"
        clipRule="evenodd"
      />
    </svg>
  );
});

export { IconFilter };
