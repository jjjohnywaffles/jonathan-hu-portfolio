import { useMemo } from 'react';
import type { Card } from '@trello/_lib/types';

export type ArchivedCard = Card & {
  archived: true;
  archivedAt: string;
};

export function useArchivedCardsSearch(cards: ArchivedCard[], searchQuery: string): ArchivedCard[] {
  return useMemo(() => {
    if (!searchQuery.trim()) {
      return cards;
    }

    const query = searchQuery.toLowerCase();
    return cards.filter(
      (card) =>
        card.title.toLowerCase().includes(query) ||
        (card.description && card.description.toLowerCase().includes(query))
    );
  }, [cards, searchQuery]);
}
