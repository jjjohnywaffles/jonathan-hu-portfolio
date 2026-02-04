import type { MouseEvent } from 'react';

interface WindowHeaderProps {
  title: string;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized?: boolean;
  isFocused?: boolean;
}

export const WindowHeader = ({
  title,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  isFocused = true,
}: WindowHeaderProps) => {
  const handleButtonClick = (e: MouseEvent, handler: () => void) => {
    e.stopPropagation();
    handler();
  };

  const buttonBaseClasses =
    'w-3 h-3 rounded-full border-none p-0 transition-[filter] duration-150 flex items-center justify-center group-hover:[&_svg]:opacity-100';
  const iconClasses = 'opacity-0 text-black/50 transition-opacity duration-150 block';
  const unfocusedClasses = !isFocused
    ? 'saturate-50 brightness-[0.8] hover:saturate-100 hover:brightness-100'
    : '';

  return (
    <div className="flex items-center py-3 px-4 bg-bg-header border-b border-border select-none">
      <div className="flex gap-2 group">
        <button
          className={`${buttonBaseClasses} bg-[#ff5f56] ${unfocusedClasses} hover:brightness-[0.85] active:brightness-[0.7]`}
          onClick={(e) => handleButtonClick(e, onClose)}
          aria-label="Close window"
        >
          <svg className={iconClasses} viewBox="0 0 12 12" width="8" height="8">
            <path
              d="M3 3L9 9M9 3L3 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          className={`${buttonBaseClasses} bg-[#ffbd2e] ${unfocusedClasses} hover:brightness-[0.85] active:brightness-[0.7]`}
          onClick={(e) => handleButtonClick(e, onMinimize)}
          aria-label="Minimize window"
        >
          <svg className={iconClasses} viewBox="0 0 12 12" width="8" height="8">
            <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className={`${buttonBaseClasses} bg-[#27ca40] ${unfocusedClasses} hover:brightness-[0.85] active:brightness-[0.7]`}
          onClick={(e) => handleButtonClick(e, onMaximize)}
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        >
          {isMaximized ? (
            <svg className={iconClasses} viewBox="0 0 12 12" width="8" height="8">
              <path
                d="M4 6L1.5 3.5M4 6L1.5 8.5M8 6L10.5 3.5M8 6L10.5 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg className={iconClasses} viewBox="0 0 12 12" width="8" height="8">
              <path
                d="M1.5 6L4 3.5M1.5 6L4 8.5M10.5 6L8 3.5M10.5 6L8 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>
      <span className="flex-1 text-center text-xs text-text-secondary">{title}</span>
      <div className="w-[52px]" />
    </div>
  );
};
