import React, { memo } from 'react';
import type { FC } from 'react';
import { IconComment } from '../../icons/card-modal/icon-comment';
import { IconPowerUps } from '../../icons/card-modal/icon-power-ups';
import { IconAutomation } from '../../icons/card-modal/icon-automation';

type BottomNavigationProps = {
  bottomNavRef: React.RefObject<HTMLDivElement | null>;
  isSidebarVisible: boolean;
  onToggleSidebar: (e: React.MouseEvent) => void;
};

const BottomNavigation: FC<BottomNavigationProps> = memo(function BottomNavigation({
  bottomNavRef,
  isSidebarVisible,
  onToggleSidebar,
}) {
  return (
    <div className="mt-4 flex flex-shrink-0 justify-center">
      <nav ref={bottomNavRef} className="rounded-lg border border-gray-200 bg-white p-2 shadow-md">
        <div className="flex items-center gap-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-100"
            role="checkbox"
            aria-checked="false"
            aria-label="Power-ups"
          >
            <IconPowerUps className="h-4 w-4" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-100"
            role="checkbox"
            aria-checked="false"
            aria-label="Automations"
          >
            <IconAutomation className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-gray-300"></span>
          <button
            className={`relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
              isSidebarVisible
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            role="checkbox"
            aria-checked={isSidebarVisible}
            aria-label="Comments and activity"
            data-testid="card-back-activity-button"
            onClick={onToggleSidebar}
          >
            <IconComment className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </div>
  );
});

export { BottomNavigation };
