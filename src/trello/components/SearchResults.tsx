import React, { memo, useEffect } from 'react';
import { useTrelloUI } from './TrelloUIContext';
import { IconSearchCard } from './icons/header/icon-search-card';
import { IconSearchBoard } from './icons/header/icon-search-board';
import type { Card } from '@trello/_lib/types';
import {
  useSearchIsActive,
  useSortedSearchResults,
  useSearchQuery,
  useTrelloOperations,
  useCardBoard,
  useCardList,
} from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';

const BOARD_DISPLAY_LIMIT = 5;
const CARD_DISPLAY_LIMIT = 10;

const SearchResults: React.FC = memo(function SearchResults() {
  const isSearchActive = useSearchIsActive();
  const searchResults = useSortedSearchResults();
  const searchQuery = useSearchQuery();
  const { addRecentSearch, setSearchActive, clearSearch, switchBoard } = useTrelloOperations();
  const { openCardModal } = useTrelloUI();
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);

  useEffect(() => {
    if (isSearchActive && searchQuery.length >= 2 && searchResults.totalCount > 0) {
      const timeoutId = setTimeout(() => {
        addRecentSearch({
          query: searchQuery,
          resultCount: searchResults.totalCount,
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [searchQuery, searchResults.totalCount, isSearchActive, addRecentSearch]);

  const { cards, boards, totalCount } = searchResults;
  const boardRecords = boards ?? [];

  // Separate archived and unarchived cards
  const unarchivedCards = cards.filter(
    (card) => card.archived !== true && card.archivedWithList == null
  );
  const archivedCards = cards.filter(
    (card) => card.archived === true || card.archivedWithList != null
  );

  const displayedBoardIds = boardRecords.slice(0, BOARD_DISPLAY_LIMIT);
  const displayedUnarchivedCards = unarchivedCards.slice(0, CARD_DISPLAY_LIMIT);
  const displayedArchivedCards = archivedCards.slice(0, CARD_DISPLAY_LIMIT);

  const handleClose = () => {
    // Clear the query and deactivate search so the bar resets fully
    clearSearch();
  };

  const handleCardClick = (cardId: string, cardBoardId?: string) => {
    if (cardBoardId != null && cardBoardId !== currentBoardId) {
      switchBoard({ boardId: cardBoardId });
      setTimeout(() => {
        openCardModal(cardId);
      }, 0);
      handleClose();
      return;
    }

    openCardModal(cardId);
    handleClose();
  };

  const handleBoardClick = (boardId: string) => {
    if (boardId !== currentBoardId) {
      switchBoard({ boardId });
    }
    handleClose();
  };

  if (totalCount === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <div className="mb-2 text-slate-400">
          <svg
            className="mx-auto h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h4 className="mb-1 text-sm font-medium text-slate-900">No results found</h4>
        <p className="text-xs text-slate-600">No cards or boards match "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {(unarchivedCards.length > 0 || archivedCards.length > 0) && (
        <div className="mb-2">
          <div className="bg-slate-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Cards
          </div>
          <div className="px-2 py-1">
            <div className="space-y-0.5">
              {displayedUnarchivedCards.map((card) => (
                <CardSearchResult key={card.id} card={card} onCardClick={handleCardClick} />
              ))}
              {displayedArchivedCards.map((card) => (
                <CardSearchResult key={card.id} card={card} onCardClick={handleCardClick} />
              ))}
            </div>
          </div>
        </div>
      )}

      {displayedBoardIds.length > 0 && (
        <div>
          <div className="bg-slate-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Boards
          </div>
          <div className="px-2 py-1">
            <div className="space-y-0.5">
              {displayedBoardIds.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded py-1 text-left hover:bg-slate-50"
                  onClick={() => handleBoardClick(board.id)}
                >
                  <IconSearchBoard
                    color={board.background || '#0079BF'}
                    className="flex-shrink-0"
                  />
                  <div>
                    <div className="text-sm leading-tight font-medium text-slate-900">
                      {board.title}
                    </div>
                    <div className="-mt-0.5 text-xs leading-tight text-slate-600">
                      {board.id === currentBoardId ? 'Current Board' : 'Private Workspace'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {boardRecords.length > BOARD_DISPLAY_LIMIT && (
              <div className="mt-1 border-t border-slate-100 py-1 text-center">
                <span className="text-xs text-slate-500">
                  Showing first 5 boards, {boardRecords.length - BOARD_DISPLAY_LIMIT} more available
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 px-2 py-1">
        <button
          type="button"
          className="matrices-disabled flex w-full items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          onClick={handleClose}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          View all results
          <svg className="ml-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

const CardSearchResult: React.FC<{
  card: Card;
  onCardClick: (cardId: string, cardBoardId?: string) => void;
}> = memo(function CardSearchResult({ card, onCardClick }) {
  const cardBoard = useCardBoard(card.id);
  const cardList = useCardList(card.id);

  const handleClick = () => {
    onCardClick(card.id, card.boardId);
  };

  const isArchived = card.archived === true || card.archivedWithList != null;

  let metadataText = 'Unknown location';
  if (cardBoard?.boardTitle && cardList?.title) {
    metadataText = `${cardBoard.boardTitle}: ${cardList.title}`;
  } else if (cardBoard?.boardTitle) {
    metadataText = cardBoard.boardTitle;
  } else if (cardList?.title) {
    metadataText = cardList.title;
  }

  if (isArchived) {
    metadataText += ' • Archived';
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded py-1 text-left hover:bg-slate-50"
      onClick={handleClick}
    >
      <IconSearchCard className="flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm leading-tight font-medium text-slate-900">
          {card.title}
        </div>
        <div className="-mt-0.5 truncate text-xs leading-tight text-slate-600">{metadataText}</div>
      </div>
    </button>
  );
});

export { SearchResults };
