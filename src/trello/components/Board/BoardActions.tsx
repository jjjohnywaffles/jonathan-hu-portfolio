import React, { memo } from 'react';
import type { FC } from 'react';
import { IconBoardPowerUps } from '../icons/board/icon-board-power-ups';
import { IconBoardAutomation } from '../icons/board/icon-board-automation';
import { IconBoardStar } from '../icons/board/icon-board-star';
import { IconChangeVisibility } from '../icons/board/icon-change-visibility';
import { IconButton, FlexContainer } from '../ui';
import { useTrelloUI } from '../TrelloUIContext';
import { useIsBoardStarred } from '@trello/_lib/selectors';

const BoardActions: FC = memo(function BoardActions() {
  const { toggleStarred, isPowerUpsActive } = useTrelloUI();
  const isStarred = useIsBoardStarred();

  return (
    <>
      {/* PowerUps - hidden on screens smaller than lg */}
      <IconButton
        className={`matrices-disabled hidden h-8 w-8 items-center justify-center lg:flex ${
          isPowerUpsActive ? 'bg-white hover:bg-gray-100' : 'hover:bg-white/10'
        }`}
        variant="ghost"
        size="sm"
        aria-disabled="true"
      >
        <IconBoardPowerUps className="h-4 w-4" active={isPowerUpsActive} />
      </IconButton>

      {/* Automation - hidden on screens smaller than xl */}
      <IconButton
        variant="ghost"
        size="sm"
        className="matrices-disabled hidden h-8 w-8 items-center justify-center hover:bg-white/10 xl:flex"
      >
        <IconBoardAutomation className="h-4 w-4" />
      </IconButton>

      {/* Star and Visibility - progressively hidden */}
      <FlexContainer gap="2">
        {/* Star - hidden on screens smaller than md */}
        <IconButton
          variant="ghost"
          size="sm"
          className="hidden h-8 w-8 items-center justify-center hover:bg-white/10 md:flex"
          onClick={toggleStarred}
        >
          <IconBoardStar className="h-4 w-4" filled={isStarred} />
        </IconButton>

        {/* Visibility - hidden on screens smaller than lg */}
        <IconButton
          variant="ghost"
          size="sm"
          className="matrices-disabled hidden h-8 w-8 items-center justify-center hover:bg-white/10 lg:flex"
        >
          <IconChangeVisibility className="h-5 w-5" />
        </IconButton>
      </FlexContainer>
    </>
  );
});

export { BoardActions };
