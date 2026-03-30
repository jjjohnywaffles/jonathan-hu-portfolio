import type { TrelloStoreData, Card, List } from '../types';
import { assignCardUrlMetadata, ensureBoardUrlMetadata } from './url-meta';

export type TrelloUrlNormalizableData = Pick<TrelloStoreData, 'boards' | 'cards' | 'lists'>;

function sortCardsChronologically(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return a.id.localeCompare(b.id);
    }
    if (Number.isNaN(aTime)) {
      return 1;
    }
    if (Number.isNaN(bTime)) {
      return -1;
    }
    if (aTime === bTime) {
      return a.id.localeCompare(b.id);
    }
    return aTime - bTime;
  });
}

/**
 * Ensures every board/card in the store has deterministic URL metadata.
 * Mutates the provided store data in-place.
 */
export function normalizeTrelloUrlMetadata<T extends TrelloUrlNormalizableData>(data: T): T {
  const cardToListId: Record<string, string> = {};
  for (const list of Object.values(data.lists)) {
    for (const ref of list.cardRefs) {
      cardToListId[ref.cardId] = list.id;
    }
  }

  const cardsByBoard: Record<string, Card[]> = {};
  for (const card of Object.values(data.cards)) {
    if (!cardsByBoard[card.boardId]) {
      cardsByBoard[card.boardId] = [];
    }
    cardsByBoard[card.boardId]?.push(card);
  }

  for (const board of Object.values(data.boards)) {
    const metadata = ensureBoardUrlMetadata(board);
    if (metadata.nextCardNumber == null || metadata.nextCardNumber < 1) {
      metadata.nextCardNumber = 1;
    }
  }

  for (const [boardId, boardCards] of Object.entries(cardsByBoard)) {
    const board = data.boards[boardId];
    if (!board) continue;

    const chronological = sortCardsChronologically(
      boardCards.filter((card) => card.isMirror !== true && card.deleted !== true)
    );

    let nextSequence =
      board.urlMetadata?.nextCardNumber && board.urlMetadata.nextCardNumber > 1
        ? board.urlMetadata.nextCardNumber
        : 1;

    for (const card of chronological) {
      const cardNumber = card.urlMetadata?.number;
      if (cardNumber != null) {
        nextSequence = Math.max(nextSequence, cardNumber + 1);
        continue;
      }

      const listId = cardToListId[card.id];
      if (listId === 'inbox') {
        assignCardUrlMetadata(card, board, { skipSequence: true });
        continue;
      }

      const metadata = assignCardUrlMetadata(card, board, {
        forceSequence: true,
      });
      if (metadata.number != null) {
        nextSequence = Math.max(nextSequence, metadata.number + 1);
      }
    }

    for (const card of boardCards) {
      if (card.isMirror === true) {
        assignCardUrlMetadata(card, board, { skipSequence: true });
      }
    }

    const boardMetadata = ensureBoardUrlMetadata(board);
    boardMetadata.nextCardNumber = nextSequence;
  }

  return data;
}

export function shouldNormalizeTrelloUrlMetadata(data: TrelloUrlNormalizableData): boolean {
  const boardsMissing = Object.values(data.boards).some((board) => board.urlMetadata == null);
  if (boardsMissing) {
    return true;
  }

  const cardsMissing = Object.values(data.cards).some((card) => card.urlMetadata == null);
  return cardsMissing;
}

export function ensureInboxList<T extends Pick<TrelloStoreData, 'lists' | 'currentBoardId'>>(
  data: T
): T {
  if (data.lists['inbox']) {
    return data;
  }

  data.lists['inbox'] = {
    id: 'inbox',
    boardId: data.currentBoardId,
    title: 'Inbox',
    cardRefs: [],
    order: Object.keys(data.lists).length,
    isDraggable: false,
  };

  return data;
}
