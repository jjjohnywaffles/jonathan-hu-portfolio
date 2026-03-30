import { useState, useCallback, useRef, useEffect } from 'react';
import { useTrelloUI } from '../components/TrelloUIContext';
import { useBoardTitle, useTrelloOperations } from '@trello/_lib/selectors';

export function useBoardTitleEdit() {
  const boardTitle = useBoardTitle();
  const { updateBoardTitle } = useTrelloOperations();
  const {
    isEditingBoardTitle,
    editingBoardTitle,
    startBoardTitleEdit,
    updateBoardTitleEdit,
    saveBoardTitleEdit,
    cancelBoardTitleEdit,
  } = useTrelloUI();

  const boardTitleInputRef = useRef<HTMLInputElement>(null);

  const handleBoardTitleClick = useCallback(() => {
    startBoardTitleEdit(boardTitle);
  }, [boardTitle, startBoardTitleEdit]);

  const handleBoardTitleSave = useCallback(() => {
    const trimmedTitle = editingBoardTitle.trim();
    if (trimmedTitle && trimmedTitle !== boardTitle) {
      updateBoardTitle({ title: trimmedTitle });
    }
    saveBoardTitleEdit();
  }, [editingBoardTitle, boardTitle, updateBoardTitle, saveBoardTitleEdit]);

  const handleBoardTitleCancel = useCallback(() => {
    cancelBoardTitleEdit();
  }, [cancelBoardTitleEdit]);

  const handleBoardTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBoardTitleSave();
      } else if (e.key === 'Escape') {
        handleBoardTitleCancel();
      }
    },
    [handleBoardTitleSave, handleBoardTitleCancel]
  );

  // Focus and select board title input when editing starts
  useEffect(() => {
    if (isEditingBoardTitle && boardTitleInputRef.current) {
      boardTitleInputRef.current.focus();
      boardTitleInputRef.current.select();
    }
  }, [isEditingBoardTitle]);

  return {
    boardTitle,
    isEditingBoardTitle,
    editingBoardTitle,
    boardTitleInputRef,
    handleBoardTitleClick,
    handleBoardTitleSave,
    handleBoardTitleCancel,
    handleBoardTitleKeyDown,
    updateBoardTitleEdit,
  };
}
