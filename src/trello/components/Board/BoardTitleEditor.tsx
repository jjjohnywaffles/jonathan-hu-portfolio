import React, { memo } from 'react';
import type { FC } from 'react';
import { IconBoardViews } from '../icons/board/icon-board-views';
import { IconChevronDown } from '../icons/board/icon-chevron-down';
import { FlexContainer } from '../ui';
import { useBoardTitleEdit } from '../../hooks/use-board-title-edit';

const BoardTitleEditor: FC = memo(function BoardTitleEditor() {
  const {
    boardTitle,
    isEditingBoardTitle,
    editingBoardTitle,
    boardTitleInputRef,
    handleBoardTitleClick,
    handleBoardTitleSave,
    handleBoardTitleKeyDown,
    updateBoardTitleEdit,
  } = useBoardTitleEdit();

  return (
    <FlexContainer className="min-w-0">
      {isEditingBoardTitle ? (
        <input
          ref={boardTitleInputRef}
          className="min-w-[120px] rounded border-2 border-blue-400 bg-white px-2 py-1 text-center text-base font-bold text-gray-800 outline-none"
          value={editingBoardTitle}
          onChange={(e) => updateBoardTitleEdit(e.target.value)}
          onBlur={handleBoardTitleSave}
          onKeyDown={handleBoardTitleKeyDown}
          style={{
            width: `${Math.max(120, editingBoardTitle.length * 10 + 24)}px`,
          }}
        />
      ) : (
        <span
          className="flex h-9 min-w-0 cursor-pointer items-center truncate rounded px-2 py-2 transition-colors hover:bg-white/10"
          onClick={handleBoardTitleClick}
          title={boardTitle}
        >
          {boardTitle}
        </span>
      )}
      <button className="matrices-disabled ml-2 hidden h-9 flex-shrink-0 items-center gap-1 rounded px-3 py-2 transition-colors hover:bg-[#337da7] sm:flex">
        <IconBoardViews className="h-5 w-5 text-white" />
        <IconChevronDown className="h-3 w-3 text-white" />
      </button>
    </FlexContainer>
  );
});

export { BoardTitleEditor };
