import React, { memo, useMemo } from 'react';
import type { FC } from 'react';
import { useTrelloUI } from '../../TrelloUIContext';
import {
  useTrelloOperations,
  useCard,
  useCardBoard,
  useBoards,
  useCardList,
  useList,
} from '@trello/_lib/selectors';

type MirrorCardPrefixProps = {
  cardId: string;
  onClose: () => void;
};

const MirrorCardPrefix: FC<MirrorCardPrefixProps> = memo(function MirrorCardPrefix({
  cardId,
  onClose,
}) {
  const { removeMirrorCard } = useTrelloOperations();
  const card = useCard(cardId);
  const original = useCard(card?.mirrorOf ?? '');
  const currentBoard = useCardBoard(cardId);
  const allBoards = useBoards();
  const fallbackList = useCardList(cardId);
  const { activeCardModalListId } = useTrelloUI();
  const activeList = useList(activeCardModalListId ?? '');
  const currentList = activeList ?? fallbackList;

  // Get source board information for cross-board mirrors
  const sourceBoardInfo = useMemo(() => {
    if (!card?.boardId) return null;
    return allBoards.find((board) => board.id === card.boardId);
  }, [card?.boardId, allBoards]);

  const handleRemoveFromBoard = () => {
    if (!currentList) {
      onClose();
      return;
    }

    removeMirrorCard({
      cardId,
      listId: currentList.id,
    });
    onClose();
  };

  // Determine the message based on whether it's a cross-board mirror
  const message = useMemo<React.ReactNode>(() => {
    const isDeleted =
      (card?.deleted ?? false) || ((card?.isMirror ?? false) && (original?.deleted ?? false));
    if (isDeleted) {
      return (
        <>
          The original card was <span className="font-semibold">deleted</span>. You are viewing a
          placeholder of the mirror.
        </>
      );
    }

    // Treat mirrored cards as archived if their original is archived
    const isArchived =
      (card?.archived ?? false) || ((card?.isMirror ?? false) && (original?.archived ?? false));
    if (isArchived) {
      return (
        <>
          You are viewing this <span className="font-semibold">archived card</span> outside of its
          original location
        </>
      );
    }

    if (sourceBoardInfo && currentBoard && sourceBoardInfo.id !== currentBoard.boardId) {
      return `This card is mirrored from "${sourceBoardInfo.title}" board`;
    }

    return 'You are viewing this card outside of its original location';
  }, [
    card?.deleted,
    card?.archived,
    card?.isMirror,
    original?.deleted,
    original?.archived,
    sourceBoardInfo,
    currentBoard,
  ]);

  return (
    <div className="flex-shrink-0 bg-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <svg
          className="h-4 w-4 flex-shrink-0 text-gray-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm text-gray-700">{message}</span>
        <button
          className="rounded-md bg-gray-300 px-2 py-1 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-400 hover:text-gray-900"
          onClick={handleRemoveFromBoard}
        >
          Remove from this board
        </button>
      </div>
    </div>
  );
});

export { MirrorCardPrefix };
