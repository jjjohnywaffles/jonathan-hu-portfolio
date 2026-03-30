import React, { memo, useRef, useState } from 'react';
import type { FC } from 'react';
import { IconShare } from '../icons/board/icon-share';
import { IconBoardMenu } from '../icons/board/icon-board-menu';
import { FlexContainer, IconButton } from '../ui';
import { Tooltip } from '../Tooltip';
import { BoardTitleEditor } from './BoardTitleEditor';
import { BoardFilterButton } from './BoardFilterButton';
import { BoardActions } from './BoardActions';
import { BoardModals } from './BoardModals';
import { BoardMenuModal } from './BoardMenuModal';
import { useCurrentUser } from '@trello/_lib/selectors';
import { getUserInitials } from '@trello/utils/user-initials';

const BoardHeader: FC = memo(function BoardHeader() {
  const currentUser = useCurrentUser();
  const boardMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [isBoardMenuModalOpen, setIsBoardMenuModalOpen] = useState(false);

  const handleOpenBoardMenuModal = () => {
    setIsBoardMenuModalOpen((open) => !open);
  };

  const handleCloseBoardMenuModal = () => {
    setIsBoardMenuModalOpen(false);
  };

  return (
    <FlexContainer className="relative h-14 w-full rounded-t-2xl bg-[#005c91] px-4 text-base font-bold text-white">
      {/* Top-corner shine overlays */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          aria-hidden
          className="absolute top-0 left-0 h-10 w-36"
          style={{
            background:
              'radial-gradient(68px 34px at left top, rgba(255,255,255,0.42), rgba(255,255,255,0.1) 36%, rgba(255,255,255,0) 64%)',
            filter: 'blur(2px)',
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 right-0 h-10 w-36"
          style={{
            background:
              'radial-gradient(68px 34px at right top, rgba(255,255,255,0.42), rgba(255,255,255,0.1) 36%, rgba(255,255,255,0) 64%)',
            filter: 'blur(2px)',
          }}
        />
      </div>

      <div className="relative z-10 flex w-full items-center">
        {/* Board Title - takes available space and truncates */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <BoardTitleEditor />
        </div>

        {/* Right-side icons - fixed to the right */}
        <FlexContainer className="ml-2 flex-shrink-0" gap="2">
          {/* Profile picture - hidden on smaller screens */}
          <div className="hidden md:block">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <FlexContainer className="h-8 w-8 rounded-full bg-gray-400" justify="center">
                <span className="text-xs font-medium text-white">
                  {getUserInitials(currentUser.displayName)}
                </span>
              </FlexContainer>
            )}
          </div>

          {/* Board Actions (PowerUps, Automation, Star, Visibility) - responsive hiding */}
          <BoardActions />

          {/* Filter Button */}
          <FlexContainer gap="2">
            <BoardFilterButton />
          </FlexContainer>

          {/* Share Button - hidden on smaller screens */}
          <div className="hidden sm:block">
            <Tooltip content="Share board" position="bottom" variant="light">
              <button
                className="matrices-disabled flex items-center gap-2 rounded bg-[#dcdfe4] px-3 py-1.5 text-sm font-normal text-gray-700 transition-colors hover:bg-[#d0d4db]"
                disabled
              >
                <IconShare className="h-4 w-4" />
                <span className="hidden lg:inline">Share</span>
              </button>
            </Tooltip>
          </div>

          {/* Board Menu Button */}
          <IconButton
            ref={boardMenuButtonRef}
            variant="ghost"
            size="sm"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-white hover:bg-white/10"
            onClick={handleOpenBoardMenuModal}
          >
            <IconBoardMenu className="h-4 w-4" />
          </IconButton>
        </FlexContainer>

        {/* Board Menu Modal (kept local since it's simple) */}
        <BoardMenuModal
          isOpen={isBoardMenuModalOpen}
          onClose={handleCloseBoardMenuModal}
          buttonRef={boardMenuButtonRef}
        />

        {/* All other modals are managed in BoardModals component */}
        <BoardModals boardMenuButtonRef={boardMenuButtonRef} />
      </div>
    </FlexContainer>
  );
});

export { BoardHeader };
