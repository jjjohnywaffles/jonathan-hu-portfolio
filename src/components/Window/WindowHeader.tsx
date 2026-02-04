import type { MouseEvent } from 'react';

interface WindowHeaderProps {
  title: string;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized?: boolean;
}

export const WindowHeader = ({
  title,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
}: WindowHeaderProps) => {
  const handleButtonClick = (e: MouseEvent, handler: () => void) => {
    e.stopPropagation();
    handler();
  };

  return (
    <div className={`window-header ${isMaximized ? 'maximized' : ''}`}>
      <div className="window-buttons">
        <button
          className="window-btn close"
          onClick={(e) => handleButtonClick(e, onClose)}
          aria-label="Close window"
        >
          <svg className="window-btn-icon" viewBox="0 0 12 12" width="8" height="8">
            <path
              d="M3 3L9 9M9 3L3 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          className="window-btn minimize"
          onClick={(e) => handleButtonClick(e, onMinimize)}
          aria-label="Minimize window"
        >
          <svg className="window-btn-icon" viewBox="0 0 12 12" width="8" height="8">
            <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="window-btn maximize"
          onClick={(e) => handleButtonClick(e, onMaximize)}
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        >
          {isMaximized ? (
            <svg className="window-btn-icon" viewBox="0 0 12 12" width="8" height="8">
              <path
                d="M4 6L1.5 3.5M4 6L1.5 8.5M8 6L10.5 3.5M8 6L10.5 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg className="window-btn-icon" viewBox="0 0 12 12" width="8" height="8">
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
      <span className="window-title">{title}</span>
      <div className="window-header-spacer" />
    </div>
  );
};
