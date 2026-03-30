import { useMemo } from 'react';
import { DateTime } from 'luxon';
import type { ArchivedCard } from './use-archived-cards-search';
import { mockNow } from '@trello/_lib/shims/time';

type GroupedCards = {
  past7Days: ArchivedCard[];
  olderThan14Days: ArchivedCard[];
};

export function useArchivedCardsGrouping(cards: ArchivedCard[]): GroupedCards {
  return useMemo(() => {
    const now = mockNow();
    const sevenDaysAgo = now.minus({ days: 7 });
    const fourteenDaysAgo = now.minus({ days: 14 });

    const past7Days: ArchivedCard[] = [];
    const olderThan14Days: ArchivedCard[] = [];

    for (const card of cards) {
      const archivedDate = DateTime.fromISO(card.archivedAt);
      if (archivedDate >= sevenDaysAgo) {
        past7Days.push(card);
      } else if (archivedDate <= fourteenDaysAgo) {
        olderThan14Days.push(card);
      }
    }

    // Sort by archived date (most recent first)
    past7Days.sort(
      (a, b) =>
        DateTime.fromISO(b.archivedAt).toMillis() - DateTime.fromISO(a.archivedAt).toMillis()
    );
    olderThan14Days.sort(
      (a, b) =>
        DateTime.fromISO(b.archivedAt).toMillis() - DateTime.fromISO(a.archivedAt).toMillis()
    );

    return { past7Days, olderThan14Days };
  }, [cards]);
}
