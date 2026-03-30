import React from 'react';

type IconBoardAutomationProps = {
  className?: string;
};

export const IconBoardAutomation: React.FC<IconBoardAutomationProps> = ({
  className = 'w-5 h-5',
}) => {
  return (
    <svg
      className={`${className} text-white transition-colors hover:text-gray-200`}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10.377.102a.75.75 0 0 1 .346.847L8.985 7.25h4.265a.75.75 0 0 1 .53 1.28l-7.25 7.25a.75.75 0 0 1-1.253-.73l1.738-6.3H2.75a.75.75 0 0 1-.53-1.28L9.47.22a.75.75 0 0 1 .907-.118M7.43 7.25l1.093-3.96L4.56 7.25zm1.142 1.5-1.093 3.96 3.961-3.96z"
        clipRule="evenodd"
      />
    </svg>
  );
};
