import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTrelloUI } from './TrelloUIContext';
import { useBoardFilters, useIsCardInInbox, useTrelloOperations } from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';
import { withSiteBasePath } from '@trello/_lib/shims/base-path';
import {
  buildBoardFilterValue,
  buildCardFilterValue,
  type FilterSerializationContext,
  getBoardRelativePath,
  getCardRelativePath,
  getBoardShortId,
  getCardShortId,
  parseBoardFiltersFromQuery,
} from '@trello/_lib/utils/url-meta';

function getRelativePathname(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const rooted = withSiteBasePath('/');
  const normalizedRoot = rooted === '/' ? '/' : rooted.replace(/\/+$/, '') || '/';
  const { pathname } = window.location;

  if (normalizedRoot === '/' || normalizedRoot === '') {
    return pathname || '/';
  }

  if (pathname.startsWith(normalizedRoot)) {
    const remainder = pathname.slice(normalizedRoot.length);
    if (!remainder) {
      return '/';
    }
    return remainder.startsWith('/') ? remainder : `/${remainder}`;
  }

  return pathname || '/';
}

function buildAbsolutePath(path: string): string {
  return withSiteBasePath(path);
}

const TrelloUrlSync = () => {
  const boards = useTrelloStore((state) => state.boards);
  const cards = useTrelloStore((state) => state.cards);
  const labels = useTrelloStore((state) => state.labels);
  const users = useTrelloStore((state) => state.users);
  const currentUserId = useTrelloStore((state) => state.currentUser.id);
  const boardFilters = useBoardFilters();
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const { switchBoard, updateBoardFilters, clearBoardFilters } = useTrelloOperations();
  const { activeCardModal, openCardModal, closeCardModal } = useTrelloUI();
  const isCardInInbox = useIsCardInInbox(activeCardModal ?? '');
  const [hasHydratedFromUrl, setHasHydratedFromUrl] = useState(false);
  const pendingCardIdRef = useRef<string | null>(null);
  const lastSyncedPathRef = useRef<string | null>(null);

  const boardShortIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const [id, board] of Object.entries(boards)) {
      map.set(getBoardShortId(board), id);
    }
    return map;
  }, [boards]);

  const cardShortIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const [id, card] of Object.entries(cards)) {
      map.set(getCardShortId(card), id);
    }
    return map;
  }, [cards]);

  const filterContext: FilterSerializationContext = useMemo(
    () => ({
      labelsById: labels,
      usersById: users,
      currentUserId,
    }),
    [labels, users, currentUserId]
  );

  const parseLocationTargets = useCallback(() => {
    const relativePath = getRelativePathname();
    const segments = relativePath.split('/').filter(Boolean);
    let nextBoardId: string | null = null;
    let nextCardId: string | null = null;

    if (segments[0] === 'b' && segments[1]) {
      nextBoardId = boardShortIdMap.get(segments[1]) ?? null;
    } else if (segments[0] === 'c' && segments[1]) {
      nextCardId = cardShortIdMap.get(segments[1]) ?? null;
      if (nextCardId) {
        const card = cards[nextCardId];
        if (card) {
          nextBoardId = card.boardId;
        }
      }
    }

    const filterParam = window.location.search
      ? new URLSearchParams(window.location.search).get('filter')
      : null;
    return { nextBoardId, nextCardId, filterParam };
  }, [boardShortIdMap, cardShortIdMap, cards]);

  const applyLocationState = useCallback(
    (options: { applyFilters: boolean }) => {
      const { nextBoardId, nextCardId, filterParam } = parseLocationTargets();

      if (nextBoardId && nextBoardId !== currentBoardId) {
        switchBoard({ boardId: nextBoardId });
      }

      if (options.applyFilters) {
        if (filterParam) {
          const parsedFilters = parseBoardFiltersFromQuery(filterParam, filterContext);
          if (parsedFilters) {
            updateBoardFilters({ filters: parsedFilters });
          } else {
            clearBoardFilters();
          }
        } else {
          clearBoardFilters();
        }
      }

      if (nextCardId) {
        pendingCardIdRef.current = nextCardId;
        openCardModal(nextCardId);
      } else {
        pendingCardIdRef.current = null;
        closeCardModal();
      }
    },
    [
      clearBoardFilters,
      closeCardModal,
      currentBoardId,
      filterContext,
      openCardModal,
      parseLocationTargets,
      switchBoard,
      updateBoardFilters,
    ]
  );

  useEffect(() => {
    if (hasHydratedFromUrl) {
      return;
    }
    if (Object.keys(boards).length === 0) {
      return;
    }

    applyLocationState({ applyFilters: true });
    if (lastSyncedPathRef.current == null) {
      lastSyncedPathRef.current = `${window.location.pathname}${window.location.search}`;
    }
    setHasHydratedFromUrl(true);
  }, [hasHydratedFromUrl, boards, applyLocationState]);

  useEffect(() => {
    if (!hasHydratedFromUrl) {
      return;
    }
    const handlePopState = () => {
      applyLocationState({ applyFilters: false });
      lastSyncedPathRef.current = `${window.location.pathname}${window.location.search}`;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasHydratedFromUrl, applyLocationState]);

  useEffect(() => {
    if (!hasHydratedFromUrl) {
      return;
    }
    const board = boards[currentBoardId];
    if (!board) return;

    const boardPath = getBoardRelativePath(board);
    const currentFilterValue = buildBoardFilterValue(boardFilters, filterContext);

    const activeCard = activeCardModal != null ? cards[activeCardModal] : undefined;
    const cardPath = !isCardInInbox && activeCard ? getCardRelativePath(activeCard) : null;

    let nextPath = boardPath;

    if (cardPath) {
      const cardFilterValue = buildCardFilterValue(boardFilters, filterContext);
      nextPath = cardFilterValue ? `${cardPath}?filter=${cardFilterValue}` : cardPath;
    } else if (currentFilterValue) {
      nextPath = `${boardPath}?filter=${currentFilterValue}`;
    }

    const absolutePath = buildAbsolutePath(nextPath);
    const currentFullPath = `${window.location.pathname}${window.location.search}`;
    if (absolutePath !== currentFullPath) {
      if (lastSyncedPathRef.current != null) {
        window.history.pushState(window.history.state, '', absolutePath);
      } else {
        window.history.replaceState(window.history.state, '', absolutePath);
      }
      lastSyncedPathRef.current = absolutePath;
    } else if (lastSyncedPathRef.current == null) {
      lastSyncedPathRef.current = currentFullPath;
    }
  }, [
    hasHydratedFromUrl,
    boards,
    cards,
    boardFilters,
    currentBoardId,
    activeCardModal,
    isCardInInbox,
    filterContext,
  ]);

  useEffect(() => {
    if (!hasHydratedFromUrl) {
      return;
    }
    if (pendingCardIdRef.current && activeCardModal !== pendingCardIdRef.current) {
      pendingCardIdRef.current = null;
    }
  }, [hasHydratedFromUrl, activeCardModal]);

  return null;
};

export { TrelloUrlSync };
