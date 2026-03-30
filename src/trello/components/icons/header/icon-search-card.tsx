import type { FC } from 'react';

type IconSearchCardProps = {
  className?: string;
};

const IconSearchCard: FC<IconSearchCardProps> = ({ className = '' }) => {
  return (
    <svg
      width="24"
      height="19"
      viewBox="0 0 24 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66667 0C1.19391 0 0 1.19391 0 2.66667V16C0 17.4728 1.19391 18.6667 2.66667 18.6667H21.3333C22.8061 18.6667 24 17.4728 24 16V2.66667C24 1.19391 22.8061 0 21.3333 0H2.66667ZM21.3333 2.66667H2.66667V10.6667H21.3333V2.66667ZM18.6667 14.6667C18.6667 15.403 19.2636 16 20 16C20.7364 16 21.3333 15.403 21.3333 14.6667C21.3333 13.9303 20.7364 13.3333 20 13.3333C19.2636 13.3333 18.6667 13.9303 18.6667 14.6667ZM4 16C3.26362 16 2.66667 15.403 2.66667 14.6667C2.66667 13.9303 3.26362 13.3333 4 13.3333H9.33333C10.0697 13.3333 10.6667 13.9303 10.6667 14.6667C10.6667 15.403 10.0697 16 9.33333 16H4Z"
        fill="#0079BF"
      />
    </svg>
  );
};

export { IconSearchCard };
