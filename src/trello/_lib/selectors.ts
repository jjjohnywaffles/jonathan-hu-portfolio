import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import type {
  Card,
  CardRef,
  List,
  User,
  TrelloUser,
  Comment,
  Activity,
  Label,
  Board,
  Checklist,
  CustomFieldDefinition,
} from './types';
import { trelloStoreOperationDefinitions } from './operations';
import { useTrelloStore } from './index';
import { getDueDateInfo } from '@trello/utils/due-date';
import { sortLabelsByColor } from '@trello/utils/label-colors';
import { mockNow } from '@trello/_lib/shims/time';
import type { StripState } from '@trello/_lib/shims/types';

// Stable empty arrays to avoid creating new references in Zustand selectors
const EMPTY_STRING_ARRAY: string[] = [];

// Board selectors
export function useBoardTitle(): string {
  return useTrelloStore((state) => {
    const currentBoard = state.boards[state.currentBoardId];
    return currentBoard?.title ?? '';
  });
}

export function useIsBoardStarred(): boolean {
  return useTrelloStore((state) => {
    const currentBoard = state.boards[state.currentBoardId];
    return currentBoard?.starred ?? false;
  });
}

export function useBoards(): Board[] {
  const boards = useTrelloStore((state) => state.boards);

  return useMemo(() => Object.values(boards), [boards]);
}

export function useBoardLists(boardId: string): List[] {
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    return Object.values(lists)
      .filter((list) => list.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  }, [lists, boardId]);
}

export function useMoveableBoardLists(boardId: string): List[] {
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    return Object.values(lists)
      .filter((list) => list.boardId === boardId && list.id !== 'inbox' && !list.archived)
      .sort((a, b) => a.order - b.order);
  }, [lists, boardId]);
}

export function useBoardListCards(boardId: string, listId: string): Card[] {
  const cards = useTrelloStore((state) => state.cards);
  const list = useTrelloStore((state) => state.lists[listId]);

  return useMemo(() => {
    if (!list || list.boardId !== boardId) return [];

    return list.cardRefs
      .map((ref) => {
        const card = cards[ref.cardId];
        if (!card) return null;

        // Mirror-as-card: reflect original archived/deleted state on the mirror
        if (card.isMirror && card.mirrorOf) {
          const original = cards[card.mirrorOf];
          if (original) {
            return {
              ...card,
              archived: original.archived,
              archivedAt: original.archivedAt,
              deleted: original.deleted,
              deletedAt: original.deletedAt,
            };
          }
        }
        return card;
      })
      .filter((card): card is Card => card !== null);
  }, [cards, list, boardId]);
}

// List selectors
export function useLists(): List[] {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    return Object.values(lists)
      .filter((list) => list.boardId === currentBoardId)
      .sort((a, b) => a.order - b.order);
  }, [lists, currentBoardId]);
}

export function useList(listId: string): List | undefined {
  return useTrelloStore((state) => state.lists[listId]);
}

// Cross-board selectors for search results
export function useCardBoard(cardId: string): { boardId: string; boardTitle: string } | null {
  const card = useTrelloStore((state) => state.cards[cardId]);
  const boards = useTrelloStore((state) => state.boards);

  return useMemo(() => {
    if (!card) return null;

    const board = boards[card.boardId];
    if (!board) return null;

    return { boardId: card.boardId, boardTitle: board.title };
  }, [card, boards]);
}

export function useCardList(cardId: string): List | null {
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    // Find which list contains this card
    for (const list of Object.values(lists)) {
      if (list.cardRefs.some((ref) => ref.cardId === cardId)) {
        return list;
      }
    }
    return null;
  }, [lists, cardId]);
}

export function useIsCardInInbox(cardId: string): boolean {
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    // Find which list contains this card
    for (const list of Object.values(lists)) {
      if (list.cardRefs.some((ref) => ref.cardId === cardId)) {
        return list.id === 'inbox';
      }
    }
    return false;
  }, [lists, cardId]);
}
export function useVisibleLists(): List[] {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const lists = useTrelloStore((state) => state.lists);

  // Memoize the filtered result to prevent infinite re-renders
  return useMemo(
    () =>
      Object.values(lists)
        .filter(
          (list: List) =>
            list.boardId === currentBoardId &&
            list.id !== 'inbox' &&
            list.isDraggable !== false &&
            !list.archived
        )
        .sort((a, b) => a.order - b.order),
    [lists, currentBoardId]
  );
}

export function useArchivedLists(): List[] {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const lists = useTrelloStore((state) => state.lists);

  // Memoize the filtered result to prevent infinite re-renders
  return useMemo(
    () =>
      Object.values(lists).filter(
        (list: List) =>
          list.boardId === currentBoardId && list.archived === true && list.archivedAt != null
      ),
    [lists, currentBoardId]
  );
}

export function useArchivedCards(): Array<Card & { archived: true; archivedAt: string }> {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const cards = useTrelloStore((state) => state.cards);
  const lists = useTrelloStore((state) => state.lists);

  // Include archived cards from the current board that were archived individually
  // Exclude cards archived as part of an archived list (they appear under Lists)
  return useMemo(() => {
    // Exclude Inbox cards from archived cards modal as a safety if needed (optional)
    const inbox = Object.values(lists).find((l) => l.id === 'inbox');
    const inboxCardIds = new Set<string>(
      (inbox?.cardRefs || []).filter((ref) => ref.type === 'card').map((ref) => ref.cardId)
    );

    return Object.values(cards).filter(
      (card): card is Card & { archived: true; archivedAt: string } =>
        card.boardId === currentBoardId &&
        card.archived === true &&
        card.archivedAt != null &&
        card.archivedWithList == null &&
        card.deleted !== true &&
        !inboxCardIds.has(card.id)
    );
  }, [currentBoardId, cards, lists]);
}

// Card selectors
export function useCard(cardId: string): Card | undefined {
  return useTrelloStore((state) => state.cards[cardId]);
}

// (legacy mirror-ref resolver removed)

// Helper to get all cards for current board
export function useCurrentBoardCards(): Card[] {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const cards = useTrelloStore((state) => state.cards);
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    const boardCards: Card[] = [];

    // Get all lists for current board
    const boardLists = Object.values(lists).filter((list) => list.boardId === currentBoardId);

    // Get all cards from those lists
    for (const list of boardLists) {
      for (const cardRef of list.cardRefs) {
        const card = cards[cardRef.cardId];
        if (!card) continue;

        // For mirror-as-card: reflect original archived/deleted state on the mirror
        if (card.isMirror && card.mirrorOf) {
          const original = cards[card.mirrorOf];
          if (original) {
            boardCards.push({
              ...card,
              archived: original.archived,
              archivedAt: original.archivedAt,
              deleted: original.deleted,
              deletedAt: original.deletedAt,
            });
            continue;
          }
        }

        boardCards.push(card);
      }
    }

    return boardCards;
  }, [currentBoardId, cards, lists]);
}

export function useListCards(listId: string): Card[] {
  const cardsRecord = useTrelloStore((state) => state.cards);
  const list = useTrelloStore((state) => state.lists[listId]);

  return useMemo(() => {
    if (!list) return [];

    return list.cardRefs
      .map((ref) => {
        const card = cardsRecord[ref.cardId];
        if (!card) return null;

        // Hide archived cards (including mirrors that are archived)
        if (card.archived) {
          return null;
        }

        // For mirror-as-card model, if the original is archived/deleted,
        // reflect that in the card display (but don't hide the mirror)
        let effective = card;
        if (card.isMirror && card.mirrorOf) {
          const original = cardsRecord[card.mirrorOf];
          if (original) {
            effective = {
              ...card,
              // Only reflect original's archived/deleted for display purposes
              // The mirror's own archived status is checked above
              __originalArchived: original.archived,
              __originalDeleted: original.deleted,
            } as Card;
          }
        }
        return effective;
      })
      .filter((card): card is Card => card !== null);
  }, [cardsRecord, list]);
}

// Helper function to check if any board filters are active
function hasActiveFilters(filters: any): boolean {
  if (filters.keyword.trim()) return true;

  if (filters.members) {
    if (
      filters.members.noMembers ||
      filters.members.assignedToMe ||
      filters.members.selectedMembers.length > 0
    )
      return true;
  }

  if (filters.cardStatus.markedComplete || filters.cardStatus.notMarkedComplete) return true;

  if (
    filters.dueDate.noDates ||
    filters.dueDate.overdue ||
    filters.dueDate.nextDay ||
    filters.dueDate.nextWeek ||
    filters.dueDate.nextMonth
  )
    return true;

  if (filters.labels) {
    if (filters.labels.noLabels || filters.labels.selectedLabels.length > 0) return true;
  }

  if (filters.activity) {
    if (
      filters.activity.lastWeek ||
      filters.activity.lastTwoWeeks ||
      filters.activity.lastFourWeeks ||
      filters.activity.withoutActivity
    )
      return true;
  }

  return false;
}

// Helper function to check if a card matches the board filters
function matchesBoardFilters(
  card: Card,
  filters: any,
  users: any,
  currentUser: any,
  labels: any[]
): boolean {
  // If there's a filter snapshot and this card is not in it,
  // then it was created after filters were applied - always show it
  if (
    filters.filterSnapshotCardIds.length > 0 &&
    !filters.filterSnapshotCardIds.includes(card.id)
  ) {
    return true;
  }

  // Keyword filter
  if (filters.keyword.trim()) {
    const keyword = filters.keyword.toLowerCase();
    if (!card.title.toLowerCase().includes(keyword)) {
      return false;
    }
  }

  // Member filters
  if (filters.members) {
    const cardMembers = card.assignedTo || [];
    if (filters.members.noMembers && cardMembers.length > 0) {
      return false;
    }
    if (filters.members.assignedToMe && !cardMembers.includes(currentUser.id)) {
      return false;
    }
    if (filters.members.selectedMembers.length > 0) {
      const hasSelectedMember = filters.members.selectedMembers.some((memberId: string) =>
        cardMembers.includes(memberId)
      );
      if (!hasSelectedMember) {
        return false;
      }
    }
  }

  // Card status filters
  if (filters.cardStatus.markedComplete && !card.completed) {
    return false;
  }
  if (filters.cardStatus.notMarkedComplete && card.completed) {
    return false;
  }

  // Due date filters
  const now = mockNow();
  const cardDueDate = card.dueDate ? DateTime.fromISO(card.dueDate) : null;

  // Check if any due date filter is active
  const dueDateFiltersActive =
    filters.dueDate.noDates ||
    filters.dueDate.overdue ||
    filters.dueDate.nextDay ||
    filters.dueDate.nextWeek ||
    filters.dueDate.nextMonth;

  if (dueDateFiltersActive) {
    let matchesDueDateFilter = false;

    // "No dates" filter - card should have no due date
    if (filters.dueDate.noDates && !cardDueDate) {
      matchesDueDateFilter = true;
    }

    // "Overdue" filter - card should have due date in the past or at current time
    // Match the visual display logic: cards are overdue if at current time or in the past
    // Visual shows red for cards within 1-minute buffer, but filter should only show
    // cards that are actually due or overdue (not future cards)
    if (filters.dueDate.overdue && cardDueDate) {
      const diffInMinutes = cardDueDate.diff(now, 'minutes').minutes;
      if (diffInMinutes <= 0) {
        matchesDueDateFilter = true;
      }
    }

    // "Next day" filter - card should be due within next 24 hours
    if (
      filters.dueDate.nextDay &&
      cardDueDate &&
      cardDueDate >= now &&
      cardDueDate <= now.plus({ days: 1 })
    ) {
      matchesDueDateFilter = true;
    }

    // "Next week" filter - card should be due within next 7 days
    if (
      filters.dueDate.nextWeek &&
      cardDueDate &&
      cardDueDate >= now &&
      cardDueDate <= now.plus({ weeks: 1 })
    ) {
      matchesDueDateFilter = true;
    }

    // "Next month" filter - card should be due within next 30 days
    if (
      filters.dueDate.nextMonth &&
      cardDueDate &&
      cardDueDate >= now &&
      cardDueDate <= now.plus({ months: 1 })
    ) {
      matchesDueDateFilter = true;
    }

    // If no due date filter matched, exclude this card
    if (!matchesDueDateFilter) {
      return false;
    }
  }

  // Label filters
  if (filters.labels) {
    const cardLabels = card.labelIds || [];
    const hasNoLabels = filters.labels.noLabels;
    const hasSelectedLabels = filters.labels.selectedLabels.length > 0;

    // If both "no labels" and specific labels are selected, use OR logic
    if (hasNoLabels && hasSelectedLabels) {
      const hasNoLabelsMatch = cardLabels.length === 0;
      const hasSelectedLabel = filters.labels.selectedLabels.some((labelId: string) =>
        cardLabels.includes(labelId)
      );
      // Show cards that either have no labels OR have any selected label
      if (!hasNoLabelsMatch && !hasSelectedLabel) {
        return false;
      }
    } else {
      // Only one condition is active, use AND logic
      if (hasNoLabels && cardLabels.length > 0) {
        return false;
      }
      if (hasSelectedLabels) {
        const hasSelectedLabel = filters.labels.selectedLabels.some((labelId: string) =>
          cardLabels.includes(labelId)
        );
        if (!hasSelectedLabel) {
          return false;
        }
      }
    }
  }

  // Activity filters (simplified - would need more complex logic for real implementation)
  if (filters.activity) {
    const cardUpdated = DateTime.fromISO(card.updatedAt || card.createdAt);
    const oneWeekAgo = now.minus({ weeks: 1 });
    const twoWeeksAgo = now.minus({ weeks: 2 });
    const fourWeeksAgo = now.minus({ weeks: 4 });

    if (filters.activity.lastWeek && cardUpdated < oneWeekAgo) {
      return false;
    }
    if (filters.activity.lastTwoWeeks && cardUpdated < twoWeeksAgo) {
      return false;
    }
    if (filters.activity.lastFourWeeks && cardUpdated < fourWeeksAgo) {
      return false;
    }
    if (filters.activity.withoutActivity && cardUpdated > fourWeeksAgo) {
      return false;
    }
  }

  return true;
}

// Filtered version of useListCards that applies board filters
export function useFilteredListCards(listId: string): Card[] {
  const list = useList(listId);
  const boardFilters = useBoardFilters();
  const cardsRecord = useTrelloStore((state) => state.cards);
  const users = useUsers();
  const currentUser = useCurrentUser();
  const labels = useLabels();

  return useMemo(() => {
    if (!list) return [];

    // Get all cards for this list (excluding archived)
    const allCards = list.cardRefs
      .map((ref) => {
        const card = cardsRecord[ref.cardId];
        if (!card) return null;

        if (card.archived) {
          return null;
        }

        return card;
      })
      .filter((card): card is Card => card !== null);

    // If no filters are active, return all cards
    if (!hasActiveFilters(boardFilters)) {
      return allCards;
    }

    // Apply filters
    return allCards.filter((card) =>
      matchesBoardFilters(card, boardFilters, users, currentUser, labels)
    );
  }, [list, cardsRecord, boardFilters, users, currentUser, labels]);
}

// Selector to count filtered cards for a specific list
export function useFilteredListCardCount(listId: string): number {
  const list = useList(listId);
  const boardFilters = useBoardFilters();
  const cardsRecord = useTrelloStore((state) => state.cards);
  const users = useUsers();
  const currentUser = useCurrentUser();
  const labels = useLabels();

  return useMemo(() => {
    if (!list) return 0;

    // Build cards using the same projection as useListCards without calling hooks
    const projected = list.cardRefs
      .map((ref) => {
        const card = cardsRecord[ref.cardId];
        if (!card) return null;
        return card;
      })
      .filter((c): c is Card => c != null)
      .filter((card) => !card.archived);

    if (!hasActiveFilters(boardFilters)) {
      return projected.length;
    }

    return projected.filter((card) =>
      matchesBoardFilters(card, boardFilters, users, currentUser, labels)
    ).length;
  }, [list, cardsRecord, boardFilters, users, currentUser, labels]);
}

// Selector to count total filtered cards across all lists
export function useFilteredCardCount(): number {
  const lists = useLists();
  const boardFilters = useBoardFilters();
  const cardsRecord = useTrelloStore((state) => state.cards);
  const users = useUsers();
  const currentUser = useCurrentUser();
  const labels = useLabels();

  return useMemo(() => {
    // Exclude Inbox from the board-level count
    const visibleLists = lists.filter((list) => list.id !== 'inbox');
    const allCards = visibleLists.flatMap((list) =>
      list.cardRefs
        .map((ref) => {
          const card = cardsRecord[ref.cardId];
          if (!card) return null;
          return card;
        })
        .filter((c): c is Card => c != null)
        .filter((card) => !card.archived)
    );

    if (!hasActiveFilters(boardFilters)) {
      return allCards.length;
    }

    return allCards.filter((card) =>
      matchesBoardFilters(card, boardFilters, users, currentUser, labels)
    ).length;
  }, [lists, cardsRecord, boardFilters, users, currentUser, labels]);
}

export function useVisibleListCardCount(listId: string): number {
  const list = useList(listId);
  const cardsRecord = useTrelloStore((state) => state.cards);

  return useMemo(() => {
    if (!list) return 0;

    return list.cardRefs
      .map((ref) => cardsRecord[ref.cardId])
      .filter((c): c is Card => c != null)
      .filter((card) => !card.archived).length;
  }, [list, cardsRecord]);
}

// List watch selector
export function useIsListWatched(listId: string): boolean {
  const list = useList(listId);

  return useMemo(() => {
    if (!list) return false;
    return list.watched === true;
  }, [list]);
}

// Check if a list has any completed cards
export function useListHasCompletedCards(listId: string): boolean {
  const cards = useListCards(listId);

  return useMemo(() => {
    return cards.some((card) => card.completed === true);
  }, [cards]);
}

// Count completed cards in a list
export function useListCompletedCardsCount(listId: string): number {
  const cards = useListCards(listId);

  return useMemo(() => {
    return cards.filter((card) => card.completed === true).length;
  }, [cards]);
}

// Get all completed cards in a list
export function useListCompletedCards(listId: string): Card[] {
  const cards = useListCards(listId);

  return useMemo(() => {
    return cards.filter((card) => card.completed === true);
  }, [cards]);
}

// Archived cards selector for a specific list
export function useArchivedListCards(listId: string): Card[] {
  const list = useList(listId);
  const cardsRecord = useTrelloStore((state) => state.cards);

  return useMemo(() => {
    if (!list) return [];
    return list.cardRefs
      .map((ref) => cardsRecord[ref.cardId])
      .filter((c): c is Card => c != null)
      .filter((card) => card.archived === true && card.archivedAt != null && card.deleted !== true);
  }, [list, cardsRecord]);
}

// Inbox-specific filtered cards selector
export function useFilteredInboxCards(filters: {
  keyword: string;
  cardCreated: {
    lastWeek: boolean;
    lastTwoWeeks: boolean;
    lastMonth: boolean;
  };
  cardStatus: {
    markedComplete: boolean;
    notMarkedComplete: boolean;
  };
  dueDate: {
    noDates: boolean;
    overdue: boolean;
    nextDay: boolean;
    nextWeek: boolean;
    nextMonth: boolean;
  };
}): Card[] {
  const inboxCards = useListCards('inbox');

  return useMemo(() => {
    // Check if any filters are active
    const hasActiveInboxFilters =
      filters.keyword.trim() ||
      (filters.cardCreated &&
        (filters.cardCreated.lastWeek ||
          filters.cardCreated.lastTwoWeeks ||
          filters.cardCreated.lastMonth)) ||
      filters.cardStatus.markedComplete ||
      filters.cardStatus.notMarkedComplete ||
      filters.dueDate.noDates ||
      filters.dueDate.overdue ||
      filters.dueDate.nextDay ||
      filters.dueDate.nextWeek ||
      filters.dueDate.nextMonth;

    if (!hasActiveInboxFilters) {
      return inboxCards;
    }

    return inboxCards.filter((card) => {
      // Keyword filter
      if (
        filters.keyword.trim() &&
        !card.title.toLowerCase().includes(filters.keyword.toLowerCase())
      ) {
        return false;
      }

      // Card created filters
      if (filters.cardCreated) {
        const hasCreatedFilter =
          filters.cardCreated.lastWeek ||
          filters.cardCreated.lastTwoWeeks ||
          filters.cardCreated.lastMonth;
        if (hasCreatedFilter) {
          const now = mockNow();
          const cardCreatedDate = DateTime.fromISO(card.createdAt);
          const daysDiff = Math.floor(now.diff(cardCreatedDate, 'days').days);

          let matchesCreatedFilter = false;
          if (filters.cardCreated.lastWeek && daysDiff <= 7) matchesCreatedFilter = true;
          if (filters.cardCreated.lastTwoWeeks && daysDiff <= 14) matchesCreatedFilter = true;
          if (filters.cardCreated.lastMonth && daysDiff <= 30) matchesCreatedFilter = true;

          if (!matchesCreatedFilter) return false;
        }
      }

      // Card status filters
      const hasStatusFilter =
        filters.cardStatus.markedComplete || filters.cardStatus.notMarkedComplete;
      if (hasStatusFilter) {
        let matchesStatusFilter = false;
        if (filters.cardStatus.markedComplete && card.completed) matchesStatusFilter = true;
        if (filters.cardStatus.notMarkedComplete && !card.completed) matchesStatusFilter = true;

        if (!matchesStatusFilter) return false;
      }

      // Due date filters
      const now = mockNow();
      const cardDueDate = card.dueDate ? DateTime.fromISO(card.dueDate) : null;

      const hasDueDateFilter =
        filters.dueDate.noDates ||
        filters.dueDate.overdue ||
        filters.dueDate.nextDay ||
        filters.dueDate.nextWeek ||
        filters.dueDate.nextMonth;

      if (hasDueDateFilter) {
        let matchesDueDateFilter = false;

        if (filters.dueDate.noDates && !cardDueDate) {
          matchesDueDateFilter = true;
        }

        if (cardDueDate) {
          const diffInDays = cardDueDate.diff(now, 'days').days;

          // Match the visual display logic: cards are overdue if at current time or in the past
          // Visual shows red for cards within 1-minute buffer, but filter should only show
          // cards that are actually due or overdue (not future cards)
          if (filters.dueDate.overdue) {
            const diffInMinutes = cardDueDate.diff(now, 'minutes').minutes;
            if (diffInMinutes <= 0) {
              matchesDueDateFilter = true;
            }
          }
          // Next day: within 24 hours + 2 minutes buffer
          if (
            filters.dueDate.nextDay &&
            cardDueDate >= now &&
            cardDueDate < now.plus({ days: 1, minutes: 2 })
          )
            matchesDueDateFilter = true;
          if (filters.dueDate.nextWeek && diffInDays >= 0 && diffInDays <= 7)
            matchesDueDateFilter = true;
          if (filters.dueDate.nextMonth && diffInDays >= 0 && diffInDays <= 30)
            matchesDueDateFilter = true;
        }

        if (!matchesDueDateFilter) return false;
      }

      return true;
    });
  }, [inboxCards, filters]);
}

// Collapsed list selectors
export function useCollapsedListIds(): string[] {
  return useTrelloStore((state) => {
    const currentBoard = state.boards[state.currentBoardId];
    return currentBoard?.collapsedListIds ?? EMPTY_STRING_ARRAY;
  });
}

// User selectors
export function useCurrentUser(): TrelloUser {
  return useTrelloStore((state) => state.currentUser);
}

export function useUsers(): Record<string, User> {
  return useTrelloStore((state) => state.users);
}

export function useUser(userId: string): User | undefined {
  return useTrelloStore((state) => state.users[userId]);
}

// Comment selectors
export function useComments(): Comment[] {
  const commentIds = useTrelloStore(
    (state) => state.boards[state.currentBoardId]?.commentIds ?? EMPTY_STRING_ARRAY
  );
  const commentsRecord = useTrelloStore((state) => state.comments);

  return useMemo(() => {
    return commentIds
      .map((commentId) => commentsRecord[commentId])
      .filter((comment) => comment != null);
  }, [commentIds, commentsRecord]);
}

export function useCardComments(cardId: string): Comment[] {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const commentIds = useTrelloStore(
    (state) => state.boards[state.currentBoardId]?.commentIds ?? EMPTY_STRING_ARRAY
  );
  const commentsRecord = useTrelloStore((state) => state.comments);
  const cards = useCurrentBoardCards();
  const card = useCard(cardId);

  return useMemo(() => {
    if (!card) return [];

    // Get all relevant card IDs for comments (original + all mirrors)
    const relevantCardIds = new Set<string>();

    if (card.isMirror && card.mirrorOf) {
      // This is a mirror card - get comments from original card
      relevantCardIds.add(card.mirrorOf);

      // Also get the original card to find all its mirrors
      const originalCard = cards.find((c: Card) => c.id === card.mirrorOf);
      if (originalCard?.mirroredBy) {
        originalCard.mirroredBy.forEach((mirrorId: string) => relevantCardIds.add(mirrorId));
      }
    } else {
      // This is an original card - get comments from it and all its mirrors
      relevantCardIds.add(cardId);
      if (card.mirroredBy) {
        card.mirroredBy.forEach((mirrorId) => relevantCardIds.add(mirrorId));
      }
    }

    // Get comments from normalized collection
    const allComments = commentIds
      .map((commentId) => commentsRecord[commentId])
      .filter((comment): comment is Comment => comment != null);

    return allComments
      .filter((comment: Comment) => relevantCardIds.has(comment.cardId))
      .sort(
        (a: Comment, b: Comment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [commentIds, commentsRecord, cards, card, cardId]);
}

export function useComment(commentId: string): Comment | undefined {
  return useTrelloStore((state) => state.comments[commentId]);
}

// ✅ FIXED: Separate selectors instead of returning new objects
export function useCardCreatedByUser(cardId: string): User | undefined {
  const card = useCard(cardId);
  const users = useUsers();

  return useMemo(() => {
    if (!card?.createdBy) return undefined;
    return users[card.createdBy];
  }, [card, users]);
}

export function useCardAssignedUsers(cardId: string): User[] {
  const card = useCard(cardId);
  const users = useUsers();

  return useMemo(() => {
    if (!card?.assignedTo) return [];
    return card.assignedTo.map((id) => users[id]).filter(Boolean);
  }, [card, users]);
}

// ✅ LEGACY: Keep useCardWithUsers for backward compatibility but mark as deprecated
/**
 * @deprecated Use useCardCreatedByUser and useCardAssignedUsers instead
 * This function violates Zustand best practices by returning new objects
 */
export function useCardWithUsers(cardId: string):
  | (Card & {
      createdByUser?: User;
      assignedUsers?: User[];
    })
  | undefined {
  const card = useCard(cardId);
  const users = useUsers();

  return useMemo(() => {
    if (!card) return undefined;

    return {
      ...card,
      createdByUser: card.createdBy ? users[card.createdBy] : undefined,
      assignedUsers: card.assignedTo
        ? card.assignedTo.map((id) => users[id]).filter(Boolean)
        : undefined,
    };
  }, [card, users]);
}

// Activity selectors
export function useCardActivities(cardId: string): Activity[] {
  const activityIds = useTrelloStore(
    (state) => state.boards[state.currentBoardId]?.activityIds ?? EMPTY_STRING_ARRAY
  );
  const activitiesRecord = useTrelloStore((state) => state.activities);

  return useMemo(() => {
    const allActivities = activityIds
      .map((activityId) => activitiesRecord[activityId])
      .filter((activity) => activity != null);

    return allActivities
      .filter((activity: Activity) => activity.cardId === cardId)
      .sort(
        (a: Activity, b: Activity) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [activityIds, activitiesRecord, cardId]);
}

export function useTemplateActivities(): Activity[] {
  const activityIds = useTrelloStore(
    (state) => state.boards[state.currentBoardId]?.activityIds ?? EMPTY_STRING_ARRAY
  );
  const activitiesRecord = useTrelloStore((state) => state.activities);

  return useMemo(() => {
    const allActivities = activityIds
      .map((activityId) => activitiesRecord[activityId])
      .filter((activity) => activity != null);

    return allActivities
      .filter((activity: Activity) => activity.type === 'template')
      .sort(
        (a: Activity, b: Activity) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [activityIds, activitiesRecord]);
}

export function useActivitiesCreatedFromTemplate(templateCardId: string): Activity[] {
  const activities = useTrelloStore((state) => {
    const currentBoard = state.boards[state.currentBoardId];
    if (!currentBoard) return [];

    return currentBoard.activityIds
      .map((activityId) => state.activities[activityId])
      .filter((activity) => activity != null);
  });

  return useMemo(() => {
    return activities
      .filter(
        (activity: Activity) =>
          activity.type === 'create' && activity.details.templateCardId === templateCardId
      )
      .sort(
        (a: Activity, b: Activity) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [activities, templateCardId]);
}

// Label selectors
export function useLabels(): Label[] {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const labelIds = useTrelloStore(
    (state) => state.boards[state.currentBoardId]?.labelIds ?? EMPTY_STRING_ARRAY
  );
  const labelsRecord = useTrelloStore((state) => state.labels);

  return useMemo(() => {
    const labels = labelIds
      .map((labelId) => labelsRecord[labelId])
      .filter((label): label is Label => label != null);

    return sortLabelsByColor(labels);
  }, [labelIds, labelsRecord]);
}

export function useLabel(labelId: string): Label | undefined {
  return useTrelloStore((state) => state.labels[labelId]);
}

export function useCardLabels(cardId: string): Label[] {
  const card = useCard(cardId);
  const currentBoardLabels = useLabels();

  return useMemo(() => {
    if (!card?.labelIds) return [];

    // If card is on the current board, use current board labels
    const currentBoardId = useTrelloStore.getState().currentBoardId;
    let labels: Label[];

    if (card.boardId === currentBoardId) {
      labels = card.labelIds
        .map((id) => currentBoardLabels.find((label) => label.id === id))
        .filter((label): label is Label => label != null);
    } else {
      // If card is on a different board (cross-board reference), get labels from normalized collection
      labels = card.labelIds
        .map((id) => useTrelloStore.getState().labels[id])
        .filter((label): label is Label => label != null);
    }

    return sortLabelsByColor(labels);
  }, [card, currentBoardLabels]);
}

// Operations selector
export function useTrelloOperations(): StripState<typeof trelloStoreOperationDefinitions> {
  return useTrelloStore(
    useShallow((state) => ({
      // Maintenance Operations
      normalizeUrlMetadata: state.normalizeUrlMetadata,
      ensureInboxList: state.ensureInboxList,

      // Search Operations
      updateSearchQuery: state.updateSearchQuery,
      clearSearch: state.clearSearch,
      addRecentSearch: state.addRecentSearch,
      removeRecentSearch: state.removeRecentSearch,
      addRecentBoard: state.addRecentBoard,
      setSearchActive: state.setSearchActive,

      // Board Filter Operations
      updateBoardFilters: state.updateBoardFilters,
      clearBoardFilters: state.clearBoardFilters,

      // Board Operations
      createBoard: state.createBoard,
      switchBoard: state.switchBoard,
      updateBoard: state.updateBoard,
      updateBoardTitle: state.updateBoardTitle,
      toggleBoardStar: state.toggleBoardStar,
      duplicateBoard: state.duplicateBoard,

      // Card operations
      addCard: state.addCard,
      updateCard: state.updateCard,
      moveCard: state.moveCard,
      deleteCard: state.deleteCard,
      copyCard: state.copyCard,
      mirrorCard: state.mirrorCard,
      archiveCard: state.archiveCard,
      unarchiveCard: state.unarchiveCard,
      removeMirrorCard: state.removeMirrorCard,
      reorderCards: state.reorderCards,
      sortCards: state.sortCards,
      toggleCardCompletion: state.toggleCardCompletion,
      joinCard: state.joinCard,
      leaveCard: state.leaveCard,
      toggleCardWatch: state.toggleCardWatch,

      // List operations
      addList: state.addList,
      copyList: state.copyList,
      moveList: state.moveList,
      moveAllCardsToList: state.moveAllCardsToList,
      sortList: state.sortList,
      toggleListWatch: state.toggleListWatch,
      archiveList: state.archiveList,
      unarchiveList: state.unarchiveList,
      deleteList: state.deleteList,
      archiveAllCardsInList: state.archiveAllCardsInList,
      unarchiveAllCardsInList: state.unarchiveAllCardsInList,
      updateListTitle: state.updateListTitle,
      reorderLists: state.reorderLists,

      // Label operations
      createLabel: state.createLabel,
      updateLabel: state.updateLabel,
      deleteLabel: state.deleteLabel,
      addLabelToCard: state.addLabelToCard,
      removeLabelFromCard: state.removeLabelFromCard,

      // Collapsed list operations
      toggleListCollapse: state.toggleListCollapse,
      collapseAllLists: state.collapseAllLists,
      expandAllLists: state.expandAllLists,
      expandList: state.expandList,

      // User operations
      updateCurrentUser: state.updateCurrentUser,
      assignUserToCard: state.assignUserToCard,
      unassignUserFromCard: state.unassignUserFromCard,

      // Comment operations
      addComment: state.addComment,
      updateComment: state.updateComment,
      deleteComment: state.deleteComment,

      // Activity operations
      addActivity: state.addActivity,

      // Checklist operations
      addChecklistSection: state.addChecklistSection,
      updateChecklistTitle: state.updateChecklistTitle,
      removeChecklistSection: state.removeChecklistSection,
      addItemToChecklistSection: state.addItemToChecklistSection,
      toggleItemInChecklistSection: state.toggleItemInChecklistSection,
      updateItemInChecklistSection: state.updateItemInChecklistSection,
      removeItemFromChecklistSection: state.removeItemFromChecklistSection,
      clearAllChecklists: state.clearAllChecklists,
      copyChecklistFromCard: state.copyChecklistFromCard,
      assignUserToChecklistItem: state.assignUserToChecklistItem,
      unassignUserFromChecklistItem: state.unassignUserFromChecklistItem,
      setChecklistItemDueDate: state.setChecklistItemDueDate,
      removeChecklistItemDueDate: state.removeChecklistItemDueDate,
      setChecklistHideCompleted: state.setChecklistHideCompleted,
      toggleChecklistHideCompleted: state.toggleChecklistHideCompleted,

      // Template operations
      makeCardTemplate: state.makeCardTemplate,
      removeCardTemplate: state.removeCardTemplate,
      createCardFromTemplate: state.createCardFromTemplate,

      // Custom Field operations
      createCustomFieldDefinition: state.createCustomFieldDefinition,
      createCustomFieldFromTemplate: state.createCustomFieldFromTemplate,
      updateCustomFieldDefinition: state.updateCustomFieldDefinition,
      deleteCustomFieldDefinition: state.deleteCustomFieldDefinition,
      reorderCustomFieldDefinition: state.reorderCustomFieldDefinition,
      addCustomFieldToAllCards: state.addCustomFieldToAllCards,
      addCustomFieldToCard: state.addCustomFieldToCard,
      removeCustomFieldFromCard: state.removeCustomFieldFromCard,
      updateCustomFieldValue: state.updateCustomFieldValue,

      // Custom Field Option Operations
      addCustomFieldOption: state.addCustomFieldOption,
      removeCustomFieldOption: state.removeCustomFieldOption,
      updateCustomFieldOption: state.updateCustomFieldOption,
      reorderCustomFieldOption: state.reorderCustomFieldOption,
    }))
  );
}

// Search selectors
export function useSearchQuery(): string {
  return useTrelloStore((state) => state.search.query);
}

export function useSearchIsActive(): boolean {
  return useTrelloStore((state) => state.search.isActive);
}

export function useSearchResults(): {
  cards: Card[];
  lists: List[];
  boards?: Board[];
  totalCount: number;
} {
  const searchState = useTrelloStore((state) => state.search);
  const cardsRecord = useTrelloStore((state) => state.cards);
  const listsRecord = useTrelloStore((state) => state.lists);
  const boardsRecord = useTrelloStore((state) => state.boards);

  return useMemo(() => {
    const cards = searchState.results.cards
      .map((cardId: string) => cardsRecord[cardId])
      .filter((card: Card | undefined): card is Card => card != null);

    const lists = searchState.results.lists
      .map((listId: string) => listsRecord[listId])
      .filter((list: List | undefined): list is List => list != null);

    const boards = searchState.results.boards
      ? searchState.results.boards
          .map((boardId: string) => boardsRecord[boardId])
          .filter((board: Board | undefined): board is Board => board != null)
      : undefined;

    return {
      cards,
      lists,
      boards,
      totalCount: searchState.results.totalCount,
    };
  }, [searchState.results, cardsRecord, listsRecord, boardsRecord]);
}

export function useRecentSearches() {
  return useTrelloStore((state) => state.search.recentSearches);
}

export function useRecentBoards() {
  return useTrelloStore((state) => state.search.recentBoards);
}

export function useParsedSearchQuery() {
  return useTrelloStore((state) => state.search.parsedQuery);
}

// Enhanced search results with sorting
export function useSortedSearchResults(): {
  cards: Card[];
  lists: List[];
  boards?: Board[];
  totalCount: number;
} {
  const searchResults = useSearchResults();
  const parsedQuery = useParsedSearchQuery();

  return useMemo(() => {
    if (!parsedQuery?.sortBy) {
      return searchResults;
    }

    const sortedCards = [...searchResults.cards].sort((a, b) => {
      switch (parsedQuery.sortBy) {
        case 'created': {
          const aCreated = new Date(a.createdAt || '').getTime();
          const bCreated = new Date(b.createdAt || '').getTime();
          return parsedQuery.sortDirection === 'asc' ? aCreated - bCreated : bCreated - aCreated;
        }

        case 'edited': {
          const aEdited = new Date(a.updatedAt || a.createdAt || '').getTime();
          const bEdited = new Date(b.updatedAt || b.createdAt || '').getTime();
          return parsedQuery.sortDirection === 'asc' ? aEdited - bEdited : bEdited - aEdited;
        }

        case 'due': {
          const aDue = new Date(a.dueDate || '').getTime();
          const bDue = new Date(b.dueDate || '').getTime();
          // Handle cards without due dates
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return parsedQuery.sortDirection === 'asc' ? aDue - bDue : bDue - aDue;
        }

        default:
          return 0;
      }
    });

    return {
      ...searchResults,
      cards: sortedCards,
    };
  }, [searchResults, parsedQuery]);
}

// Helper selector to check if search has meaningful results
export function useHasSearchResults(): boolean {
  const searchResults = useSearchResults();
  return searchResults.totalCount > 0;
}

// Board Filter selectors
export function useBoardFilters() {
  return useTrelloStore((state) => state.boardFilters);
}

export function useHasActiveBoardFilters(): boolean {
  return useTrelloStore((state) => {
    const filters = state.boardFilters;

    // Check if any filter is active
    if (filters.keyword.trim()) return true;

    if (filters.members) {
      if (
        filters.members.noMembers ||
        filters.members.assignedToMe ||
        filters.members.selectedMembers.length > 0
      )
        return true;
    }

    if (filters.cardStatus.markedComplete || filters.cardStatus.notMarkedComplete) return true;

    if (
      filters.dueDate.noDates ||
      filters.dueDate.overdue ||
      filters.dueDate.nextDay ||
      filters.dueDate.nextWeek ||
      filters.dueDate.nextMonth
    )
      return true;

    if (filters.labels) {
      if (filters.labels.noLabels || filters.labels.selectedLabels.length > 0) return true;
    }

    if (filters.activity) {
      if (
        filters.activity.lastWeek ||
        filters.activity.lastTwoWeeks ||
        filters.activity.lastFourWeeks ||
        filters.activity.withoutActivity
      )
        return true;
    }

    return false;
  });
}

export function useAreAllListsCollapsed(): boolean {
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const currentBoard = useTrelloStore((state) => state.boards[currentBoardId]);
  const lists = useTrelloStore((state) => state.lists);
  const collapsedListIds = useTrelloStore(
    (state) => state.boards[currentBoardId]?.collapsedListIds ?? EMPTY_STRING_ARRAY
  );

  return useMemo(() => {
    if (!currentBoard) return false;

    // Get all visible lists for current board (exclude inbox)
    const boardLists = Object.values(lists).filter(
      (list) => list.boardId === currentBoardId && list.id !== 'inbox'
    );
    const visibleListIds = boardLists.map((list) => list.id);

    // Return true if ANY lists are collapsed (so button shows "Expand all lists")
    // Return false only when NO lists are collapsed (so button shows "Collapse all lists")
    return (
      collapsedListIds.length > 0 &&
      visibleListIds.some((listId) => collapsedListIds.includes(listId))
    );
  }, [currentBoard, lists, currentBoardId, collapsedListIds]);
}

// Activity selectors
export function useActivities(): Activity[] {
  const activityIds = useTrelloStore(
    (state) => state.boards[state.currentBoardId]?.activityIds ?? EMPTY_STRING_ARRAY
  );
  const activitiesRecord = useTrelloStore((state) => state.activities);

  return useMemo(() => {
    return activityIds
      .map((activityId) => activitiesRecord[activityId])
      .filter((activity) => activity != null);
  }, [activityIds, activitiesRecord]);
}

// Template selectors
export function useTemplateCards(): Card[] {
  const cards = useCurrentBoardCards();

  return useMemo(() => {
    return cards.filter((card: Card) => card.isTemplate === true && !card.archived);
  }, [cards]);
}

export function useIsCardTemplate(cardId: string): boolean {
  const card = useCard(cardId);
  return card?.isTemplate === true;
}

export function useNonTemplateCards(): Card[] {
  const cards = useCurrentBoardCards();

  return useMemo(() => {
    return cards.filter((card: Card) => card.isTemplate !== true && !card.archived);
  }, [cards]);
}

export function useListTemplateCards(listId: string): Card[] {
  const list = useList(listId);
  const cardsRecord = useTrelloStore((state) => state.cards);

  return useMemo(() => {
    if (!list) return [];
    return list.cardRefs
      .map((ref) => cardsRecord[ref.cardId])
      .filter((c): c is Card => c != null)
      .filter((card) => card.isTemplate === true && !card.archived);
  }, [list, cardsRecord]);
}

export function useListNonTemplateCards(listId: string): Card[] {
  const list = useList(listId);
  const cardsRecord = useTrelloStore((state) => state.cards);

  return useMemo(() => {
    if (!list) return [];
    return list.cardRefs
      .map((ref) => cardsRecord[ref.cardId])
      .filter((c): c is Card => c != null)
      .filter((card) => card.isTemplate !== true && !card.archived);
  }, [list, cardsRecord]);
}

// Legacy selectors - kept for backwards compatibility but will return empty
export function useCardChecklist(
  cardId: string
): Array<{ label: string; checked: boolean }> | undefined {
  // Always return undefined since we no longer support legacy checklists
  return undefined;
}

export function useChecklistProgress(cardId: string): {
  completed: number;
  total: number;
  percentage: number;
} {
  // Always return empty progress since legacy checklists are no longer supported
  return { completed: 0, total: 0, percentage: 0 };
}

// Multiple Checklists selectors
export function useCardChecklists(cardId: string):
  | Array<{
      id: string;
      title: string;
      items: Array<{ label: string; checked: boolean }>;
    }>
  | undefined {
  const card = useCard(cardId);
  const checklists = useTrelloStore((state) => state.checklists);

  return useMemo(() => {
    if (!card?.checklistIds) return undefined;

    return card.checklistIds
      .map((checklistId) => checklists[checklistId])
      .filter((checklist) => checklist != null);
  }, [card, checklists]);
}

// Get a single checklist by ID
export function useChecklist(checklistId: string): Checklist | undefined {
  return useTrelloStore((state) => state.checklists[checklistId]);
}

// Get checklist item with all necessary data for action modal
export function useChecklistItemForAction(
  checklistId: string,
  itemIndex: number
): {
  item: {
    label: string;
    checked: boolean;
    assignedTo?: string;
    dueDate?: string;
  };
  exists: boolean;
} | null {
  const checklist = useChecklist(checklistId);

  return useMemo(() => {
    const item = checklist?.items?.[itemIndex];
    if (!item) {
      return null;
    }

    return {
      item: {
        label: item.label,
        checked: item.checked,
        assignedTo: item.assignedTo,
        dueDate: item.dueDate,
      },
      exists: true,
    };
  }, [checklist, itemIndex]);
}

// Custom Field Definition selectors
export function useCustomFieldDefinitions() {
  return useTrelloStore(
    useShallow((state) => {
      const currentBoard = state.boards[state.currentBoardId];
      if (!currentBoard) return [];

      return currentBoard.customFieldDefinitionIds
        .map((id) => state.customFieldDefinitions[id])
        .filter((f): f is CustomFieldDefinition => f != null)
        .sort((a, b) => a.order - b.order);
    })
  );
}

export function useCustomFieldDefinition(fieldId: string) {
  return useTrelloStore((state) => state.customFieldDefinitions[fieldId]);
}

export function useSortedCustomFieldDefinitions() {
  const definitions = useCustomFieldDefinitions();
  return useMemo(() => {
    return [...definitions].sort((a, b) => a.order - b.order);
  }, [definitions]);
}

// Card Custom Fields selectors
export function useCardCustomFields(cardId: string):
  | Array<{
      id: string;
      name: string;
      value?: string;
      type: 'text' | 'number' | 'date' | 'checkbox' | 'list';
      options?: Array<{
        label: string;
        color: string;
      }>;
      showOnFront?: boolean;
    }>
  | undefined {
  const card = useCard(cardId);
  const definitions = useCustomFieldDefinitions();

  return useMemo(() => {
    if (!card?.customFields || !definitions.length) return undefined;

    // Create sorted list based on definition order
    const sortedDefinitions = [...definitions].sort((a, b) => a.order - b.order);

    return sortedDefinitions
      .map((def) => {
        const cardField = card.customFields?.find((cf) => cf.id === def.id);
        if (!cardField) return null;

        return {
          id: def.id,
          name: def.name,
          value: cardField.value,
          type: def.type,
          options: def.options,
          showOnFront: def.showOnFront,
        };
      })
      .filter((field): field is NonNullable<typeof field> => field !== null);
  }, [card?.customFields, definitions]);
}

// Suggested Field Template selectors
export function useSuggestedFieldTemplates() {
  return useTrelloStore((state) => state.suggestedFieldTemplates);
}

export function useSuggestedFieldTemplatesByCategory(
  category?: 'productivity' | 'organization' | 'tracking'
) {
  const templates = useSuggestedFieldTemplates();
  return useMemo(() => {
    if (!category) return templates;
    return templates.filter((template: any) => template.category === category);
  }, [templates, category]);
}

export function useSuggestedFieldTemplate(templateId: string) {
  const templates = useSuggestedFieldTemplates();
  return useMemo(() => {
    return templates.find((template: any) => template.id === templateId);
  }, [templates, templateId]);
}

export function useChecklistSectionProgress(
  cardId: string,
  checklistId: string
): { completed: number; total: number; percentage: number } {
  const checklists = useCardChecklists(cardId);
  const checklist = checklists?.find((cl) => cl.id === checklistId);

  if (!checklist || checklist.items.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = checklist.items.filter((item) => item.checked).length;
  const total = checklist.items.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

export function useCardsWithChecklists(): Array<{
  cardId: string;
  cardTitle: string;
  checklistCount: number;
}> {
  const cards = useCurrentBoardCards();

  return useMemo(() => {
    // Deduplicate cards by ID to avoid duplicate entries from mirrors
    const uniqueCards = new Map<string, Card>();
    cards.forEach((card: Card) => {
      if (!card.isMirror && !uniqueCards.has(card.id)) {
        uniqueCards.set(card.id, card);
      }
    });

    return Array.from(uniqueCards.values())
      .filter((card: Card) => {
        // Only check new checklist format
        const hasChecklists = card.checklistIds && card.checklistIds.length > 0;
        return hasChecklists && !card.archived;
      })
      .map((card: Card) => {
        // Count items from checklists
        const checklistCount = card.checklistIds?.length ?? 0;

        return {
          cardId: card.id,
          cardTitle: card.title,
          checklistCount,
        };
      })
      .sort((a: any, b: any) => a.cardTitle.localeCompare(b.cardTitle));
  }, [cards]);
}

// New selector for checklist modal dropdown - returns individual checklists with card context
export function useCardsWithChecklistsDetailed(): Array<{
  cardId: string;
  cardTitle: string;
  checklists: Array<{
    id: string;
    title: string;
    itemCount: number;
  }>;
}> {
  const cards = useCurrentBoardCards();
  const checklists = useTrelloStore((state) => state.checklists);
  const lists = useTrelloStore((state) => state.lists);

  return useMemo(() => {
    // Deduplicate cards by ID to avoid duplicate entries from mirrors
    const uniqueCards = new Map<string, Card>();
    cards.forEach((card: Card) => {
      if (!card.isMirror && !uniqueCards.has(card.id)) {
        uniqueCards.set(card.id, card);
      }
    });

    // Build a fast lookup of cardIds that live in the Inbox
    const inbox = Object.values(lists).find((l) => l.id === 'inbox');
    const inboxCardIds = new Set<string>(
      (inbox?.cardRefs || []).filter((ref) => ref.type === 'card').map((ref) => ref.cardId)
    );

    return Array.from(uniqueCards.values())
      .filter((card: Card) => {
        // Only include cards with checklists that aren't archived
        const hasChecklists = card.checklistIds && card.checklistIds.length > 0;
        // Exclude Inbox cards from the copy dropdown per product requirement
        const isInboxCard = inboxCardIds.has(card.id);
        return hasChecklists && !card.archived && !isInboxCard;
      })
      .map((card: Card) => ({
        cardId: card.id,
        cardTitle: card.title,
        checklists: (card.checklistIds || [])
          .map((checklistId) => {
            const checklist = checklists[checklistId];
            return checklist
              ? {
                  id: checklist.id,
                  title: checklist.title,
                  itemCount: checklist.items.length,
                }
              : null;
          })
          .filter(
            (item): item is { id: string; title: string; itemCount: number } => item !== null
          ),
      }))
      .sort((a: any, b: any) => a.cardTitle.localeCompare(b.cardTitle));
  }, [cards, checklists, lists]);
}

// Combined checklist progress for card display
export function useCardTotalChecklistProgress(cardId: string): {
  completed: number;
  total: number;
  hasChecklists: boolean;
} {
  const card = useCard(cardId);
  const checklists = useTrelloStore((state) => state.checklists);

  return useMemo(() => {
    if (!card) {
      return { completed: 0, total: 0, hasChecklists: false };
    }

    let totalCompleted = 0;
    let totalItems = 0;
    let hasAnyChecklistSections = false;

    // Count from checklists format
    if (card.checklistIds && card.checklistIds.length > 0) {
      hasAnyChecklistSections = true;
      for (const checklistId of card.checklistIds) {
        const checklist = checklists[checklistId];
        if (checklist) {
          totalItems += checklist.items.length;
          totalCompleted += checklist.items.filter(
            (item: { label: string; checked: boolean }) => item.checked
          ).length;
        }
      }
    }

    return {
      completed: totalCompleted,
      total: totalItems,
      // Only show checklist badge when there is at least one item across all checklists
      hasChecklists: hasAnyChecklistSections && totalItems > 0,
    };
  }, [card, checklists]);
}

// Selector for getting the assigned user of a checklist item
export function useChecklistItemAssignedUser(
  cardId: string,
  checklistId: string,
  itemIndex: number
): User | undefined {
  const card = useCard(cardId);
  const users = useUsers();
  const checklist = useChecklist(checklistId);

  return useMemo(() => {
    if (!card?.checklistIds) return undefined;
    if (!checklist || !checklist.items[itemIndex]) return undefined;

    const item = checklist.items[itemIndex];
    if (!item?.assignedTo) return undefined;

    return users[item.assignedTo];
  }, [card, checklist, itemIndex, users]);
}

// Selector for getting the due date of a checklist item
export function useChecklistItemDueDate(
  cardId: string,
  checklistId: string,
  itemIndex: number
): string | undefined {
  const card = useCard(cardId);
  const checklist = useChecklist(checklistId);

  return useMemo(() => {
    if (!card?.checklistIds) return undefined;
    if (!checklist || !checklist.items[itemIndex]) return undefined;

    const item = checklist.items[itemIndex];
    return item?.dueDate;
  }, [card, checklist, itemIndex]);
}

// Selector for getting whether a checklist item is checked
export function useChecklistItemChecked(
  cardId: string,
  checklistId: string,
  itemIndex: number
): boolean {
  const card = useCard(cardId);
  const checklist = useChecklist(checklistId);

  return useMemo(() => {
    if (!card?.checklistIds) return false;
    if (!checklist || !checklist.items[itemIndex]) return false;

    const item = checklist.items[itemIndex];
    return item?.checked ?? false;
  }, [card, checklist, itemIndex]);
}

// Selector for getting the most urgent due date status from incomplete checklist items in a card
export function useCardChecklistDueDateStatus(cardId: string): {
  hasAnyDueDates: boolean;
  mostUrgentStatus: string | null;
  mostUrgentDueDate: string | null;
} {
  const card = useCard(cardId);
  const checklists = useTrelloStore((state) => state.checklists);

  return useMemo(() => {
    if (!card?.checklistIds) {
      return {
        hasAnyDueDates: false,
        mostUrgentStatus: null,
        mostUrgentDueDate: null,
      };
    }

    const allDueDates: string[] = [];

    // Collect due dates from INCOMPLETE checklist items only
    for (const checklistId of card.checklistIds) {
      const checklist = checklists[checklistId];
      if (checklist) {
        for (const item of checklist.items) {
          if (item.dueDate && !item.checked) {
            allDueDates.push(item.dueDate);
          }
        }
      }
    }

    if (allDueDates.length === 0) {
      return {
        hasAnyDueDates: false,
        mostUrgentStatus: null,
        mostUrgentDueDate: null,
      };
    }

    // Sort due dates chronologically and find the earliest (soonest) one
    const sortedDueDates = allDueDates.sort((a, b) => {
      const dateA = DateTime.fromISO(a);
      const dateB = DateTime.fromISO(b);
      return dateA.toMillis() - dateB.toMillis();
    });

    const earliestDueDate = sortedDueDates[0] ?? '';
    const { status: earliestStatus } = getDueDateInfo(earliestDueDate);

    return {
      hasAnyDueDates: true,
      mostUrgentStatus: earliestStatus,
      mostUrgentDueDate: earliestDueDate,
    };
  }, [card, checklists]);
}
