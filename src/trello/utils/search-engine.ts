import { DateTime } from 'luxon';
import type {
  Board,
  Card,
  Checklist,
  Comment,
  Label,
  List,
  ParsedSearch,
  SearchFilter,
  SearchResults,
  TrelloStoreData,
  User,
} from '@trello/_lib/types';
import { mockNow } from '@trello/_lib/shims/time';
import { colorDisplayNames } from '@trello/utils/label-colors';

type SearchTokenType = 'prefix' | 'exact';

type SearchToken = {
  value: string;
  type: SearchTokenType;
};

type TokenizationRules = {
  minPrefixLength: number;
  allowExactLengths?: number[];
  allowPrefixLengths?: number[];
};

const GENERAL_RULES: TokenizationRules = {
  minPrefixLength: 3,
  allowExactLengths: [2, 1],
};

const STRICT_OPERATOR_RULES: TokenizationRules = {
  minPrefixLength: 3,
  allowExactLengths: [2],
};

const LAX_OPERATOR_RULES: TokenizationRules = {
  minPrefixLength: 1,
  allowPrefixLengths: [1, 2],
};

const BOARD_RULES: TokenizationRules = {
  minPrefixLength: 1,
  allowPrefixLengths: [1, 2],
  allowExactLengths: [2],
};

const ALLOW_MEMBER_EMAIL_MATCH = false;

type SearchExecutionOptions = {
  allowMemberEmailMatch: boolean;
};

const DEFAULT_OPTIONS: SearchExecutionOptions = {
  allowMemberEmailMatch: ALLOW_MEMBER_EMAIL_MATCH,
};

type CardContext = {
  card: Card;
  board: Board | undefined;
  list: List | undefined;
  commentsTokens: string[];
  checklistTokens: string[];
  labelIds: string[];
  assignedTo: string[];
  isArchived: boolean;
};

type PrecomputedState = {
  cardContexts: Map<string, CardContext>;
  commentsByCardId: Map<string, Comment[]>;
  checklistsByCardId: Map<string, Checklist[]>;
  labelsByBoardId: Map<string, Label[]>;
  users: Record<string, User>;
  currentUserId: string;
};

function normalizeForTokens(value: string): string {
  const spaced = value.replace(/([a-z\d])([A-Z])/g, '$1 $2');
  return spaced.toLowerCase();
}

function tokenizeContent(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const normalized = normalizeForTokens(value);
  return normalized.match(/[a-z\d]+/g) ?? [];
}

function buildSearchTokens(value: string, rules: TokenizationRules): SearchToken[] {
  const rawTokens = tokenizeContent(value);
  const tokens: SearchToken[] = [];

  for (const rawToken of rawTokens) {
    const length = rawToken.length;
    if (length >= rules.minPrefixLength) {
      tokens.push({ value: rawToken, type: 'prefix' });
      continue;
    }

    if (rules.allowPrefixLengths?.includes(length)) {
      tokens.push({ value: rawToken, type: 'prefix' });
      continue;
    }

    if (rules.allowExactLengths?.includes(length)) {
      tokens.push({ value: rawToken, type: 'exact' });
    }
  }

  return tokens;
}

function tokenMatches(searchToken: SearchToken, candidate: string): boolean {
  if (searchToken.type === 'exact') {
    return candidate === searchToken.value;
  }
  return candidate.startsWith(searchToken.value);
}

function matchesTokens(tokens: SearchToken[], fields: Array<string | undefined>): boolean {
  if (tokens.length === 0) {
    return true;
  }

  const aggregatedTokens = new Set<string>();
  for (const field of fields) {
    for (const token of tokenizeContent(field)) {
      aggregatedTokens.add(token);
    }
  }

  if (aggregatedTokens.size === 0) {
    return false;
  }

  const candidateTokens = Array.from(aggregatedTokens);

  for (const searchToken of tokens) {
    let matched = false;
    for (const candidate of candidateTokens) {
      if (tokenMatches(searchToken, candidate)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      return false;
    }
  }

  return true;
}

function deriveColorKeywordsFromLabelColor(color: string): string[] {
  const keywords = new Set<string>();
  const lower = color.toLowerCase();

  // For hex colors, just add the hex value as a keyword
  if (lower.startsWith('#')) {
    keywords.add(lower);
    return Array.from(keywords);
  }

  keywords.add(lower);
  keywords.add(lower.replace(/_(light|dark)$/, ''));

  const displayName = colorDisplayNames[color];
  if (displayName) {
    const displayLower = displayName.toLowerCase();
    keywords.add(displayLower);
    displayLower.split(/\s+/).forEach((part) => {
      if (part.length > 0) {
        keywords.add(part);
      }
    });
  }

  return Array.from(keywords).filter((keyword) => keyword.length > 0);
}

function buildPrecomputedState(state: TrelloStoreData): PrecomputedState {
  const commentsByCardId = new Map<string, Comment[]>();
  Object.values(state.comments).forEach((comment) => {
    const list = commentsByCardId.get(comment.cardId) ?? [];
    list.push(comment);
    commentsByCardId.set(comment.cardId, list);
  });

  const checklistsByCardId = new Map<string, Checklist[]>();
  Object.values(state.checklists).forEach((checklist) => {
    const list = checklistsByCardId.get(checklist.cardId) ?? [];
    list.push(checklist);
    checklistsByCardId.set(checklist.cardId, list);
  });

  const labelsByBoardId = new Map<string, Label[]>();
  Object.values(state.labels).forEach((label) => {
    const list = labelsByBoardId.get(label.boardId) ?? [];
    list.push(label);
    labelsByBoardId.set(label.boardId, list);
  });

  const cardContexts = new Map<string, CardContext>();

  const listByCardId = new Map<string, List>();
  Object.values(state.lists).forEach((list) => {
    list.cardRefs.forEach((ref) => {
      listByCardId.set(ref.cardId, list);
    });
  });

  Object.values(state.cards).forEach((card) => {
    const board = state.boards[card.boardId];
    const list = listByCardId.get(card.id);
    const comments = commentsByCardId.get(card.id) ?? [];
    const checklists = checklistsByCardId.get(card.id) ?? [];

    const commentsTokens = comments.flatMap((comment) => tokenizeContent(comment.content));

    const checklistTokens = checklists.flatMap((checklist) => {
      const titleTokens = tokenizeContent(checklist.title);
      const itemTokens = checklist.items.flatMap((item) => tokenizeContent(item.label));
      return [...titleTokens, ...itemTokens];
    });

    const assignedTo = card.assignedTo ?? [];
    const labelIds = card.labelIds ?? [];

    const isArchived = Boolean(card.archived) || card.archivedWithList != null;
    cardContexts.set(card.id, {
      card,
      board,
      list,
      commentsTokens,
      checklistTokens,
      labelIds,
      assignedTo,
      isArchived,
    });
  });

  return {
    cardContexts,
    commentsByCardId,
    checklistsByCardId,
    labelsByBoardId,
    users: state.users,
    currentUserId: state.currentUser.id,
  };
}

function matchesMemberFilter(
  value: string,
  context: CardContext,
  users: Record<string, User>,
  options: SearchExecutionOptions,
  currentUserId: string
): boolean {
  if (value === 'me') {
    return context.assignedTo.includes(currentUserId);
  }

  if (!options.allowMemberEmailMatch && value.includes('@')) {
    return false;
  }

  const tokens = buildSearchTokens(value, LAX_OPERATOR_RULES);
  if (tokens.length === 0) {
    return false;
  }

  const assignedUsers = context.assignedTo
    .map((userId) => users[userId])
    .filter((user): user is User => user != null);

  return assignedUsers.some((user) => {
    const fields = [user.displayName];
    if (options.allowMemberEmailMatch) {
      fields.push(user.email);
    }
    return matchesTokens(tokens, fields);
  });
}

function matchesLabelFilter(
  value: string,
  context: CardContext,
  labelsByBoardId: Map<string, Label[]>
): boolean {
  // Label operator should behave like name matching but restricted to labels only,
  // and allow prefix matching starting at the first character (length >= 1).
  const search = value.trim().toLowerCase();
  if (search.length === 0) {
    return false;
  }

  if (context.labelIds.length === 0) {
    return false;
  }

  const boardId = context.card.boardId;
  const boardLabels = labelsByBoardId.get(boardId) ?? [];

  const assignedLabels = boardLabels.filter(
    (label): label is Label => label != null && context.labelIds.includes(label.id)
  );

  // Check color keywords and label titles for prefix matches
  for (const label of assignedLabels) {
    const colorKeywords = deriveColorKeywordsFromLabelColor(label.color).map((k) =>
      k.toLowerCase()
    );

    // Color match by prefix
    if (colorKeywords.some((kw) => kw.startsWith(search))) {
      return true;
    }

    // Title match by prefix (tokenized by words and raw title)
    const title = (label.title ?? '').trim().toLowerCase();
    if (title.length > 0) {
      if (title.startsWith(search)) {
        return true;
      }
      const titleTokens = title.split(/\s+/).filter(Boolean);
      if (titleTokens.some((tok) => tok.startsWith(search))) {
        return true;
      }
    }
  }

  return false;
}

function matchesListFilter(value: string, context: CardContext): boolean {
  if (!context.list) {
    return false;
  }
  const tokens = buildSearchTokens(value, LAX_OPERATOR_RULES);
  if (tokens.length === 0) {
    return false;
  }
  return matchesTokens(tokens, [context.list.title]);
}

// function matchesBoardFilter(value: string, context: CardContext): boolean {
//   if (!context.board) {
//     return false;
//   }
//   const tokens = buildSearchTokens(value, BOARD_RULES);
//   if (tokens.length === 0) {
//     return false;
//   }
//   const matchesId = context.board.id.toLowerCase() === value.toLowerCase();
//   return matchesId || matchesTokens(tokens, [context.board.title]);
// }

function matchesBoardFilter(value: string, context: CardContext): boolean {
  if (!context.board) {
    return false;
  }
  // Exact match on board title (case-insensitive). Quotes are handled in parser.
  return context.board.title.trim().toLowerCase() === value.trim().toLowerCase();
}

function matchesNameFilter(value: string, context: CardContext): boolean {
  const tokens = buildSearchTokens(value, STRICT_OPERATOR_RULES);
  if (tokens.length === 0) {
    return false;
  }
  return matchesTokens(tokens, [context.card.title]);
}

function matchesDescriptionFilter(value: string, context: CardContext): boolean {
  const tokens = buildSearchTokens(value, STRICT_OPERATOR_RULES);
  if (tokens.length === 0) {
    return false;
  }
  return matchesTokens(tokens, [context.card.description ?? '']);
}

function matchesCommentFilter(value: string, context: CardContext): boolean {
  const tokens = buildSearchTokens(value, STRICT_OPERATOR_RULES);
  if (tokens.length === 0) {
    return false;
  }
  return context.commentsTokens.some((commentToken) =>
    tokens.some((searchToken) => tokenMatches(searchToken, commentToken))
  );
}

function matchesChecklistFilter(value: string, context: CardContext): boolean {
  const tokens = buildSearchTokens(value, STRICT_OPERATOR_RULES);
  if (tokens.length === 0) {
    return false;
  }
  return context.checklistTokens.some((token) =>
    tokens.some((searchToken) => tokenMatches(searchToken, token))
  );
}

function matchesHasFilter(value: string, context: CardContext): boolean {
  switch (value) {
    case 'attachments':
      return (context.card.attachments?.length ?? 0) > 0;
    case 'description':
      return Boolean(context.card.description?.trim());
    case 'members':
      return context.assignedTo.length > 0;
    case 'cover':
      return Boolean(context.card.image);
    case 'checklists':
      return (context.card.checklistIds?.length ?? 0) > 0;
    default:
      return false;
  }
}

function matchesDueFilter(value: string, context: CardContext): boolean {
  if (!context.card.dueDate) {
    return false;
  }

  const now = mockNow();
  const dueDate = DateTime.fromISO(context.card.dueDate);
  if (!dueDate.isValid) {
    return false;
  }

  switch (value.toLowerCase()) {
    case 'day': {
      const horizon = now.plus({ days: 1 });
      return dueDate >= now && dueDate <= horizon;
    }
    case 'week': {
      const horizon = now.plus({ weeks: 1 });
      return dueDate >= now && dueDate <= horizon;
    }
    case 'month': {
      const horizon = now.plus({ months: 1 });
      return dueDate >= now && dueDate <= horizon;
    }
    case 'overdue':
      return dueDate < now;
    default: {
      const asNumber = Number(value);
      if (Number.isInteger(asNumber) && asNumber > 0) {
        const horizon = now.plus({ days: asNumber });
        return dueDate >= now && dueDate <= horizon;
      }
      return false;
    }
  }
}

function matchesEditedFilter(value: string, context: CardContext): boolean {
  if (!context.card.updatedAt) {
    return false;
  }

  const now = mockNow();
  const updatedAt = DateTime.fromISO(context.card.updatedAt);
  if (!updatedAt.isValid) {
    return false;
  }

  switch (value.toLowerCase()) {
    case 'day':
      return updatedAt >= now.minus({ days: 1 });
    case 'week':
      return updatedAt >= now.minus({ weeks: 1 });
    case 'month':
      return updatedAt >= now.minus({ months: 1 });
    default: {
      const asNumber = Number(value);
      if (Number.isInteger(asNumber) && asNumber > 0) {
        return updatedAt >= now.minus({ days: asNumber });
      }
      return false;
    }
  }
}

function matchesIsFilter(value: string, context: CardContext): boolean {
  switch (value) {
    case 'archived':
      return context.isArchived;
    case 'open':
      return !context.isArchived;
    case 'complete':
      return Boolean(context.card.completed);
    case 'incomplete':
      return !context.card.completed;
    default:
      return false;
  }
}

function matchesBoardIsFilter(value: string, board: Board): boolean {
  switch (value) {
    case 'starred':
      return board.starred === true;
    default:
      return false;
  }
}

function evaluateCardFilter(
  filter: SearchFilter,
  context: CardContext,
  precomputed: PrecomputedState,
  options: SearchExecutionOptions
): boolean {
  const value = filter.value ?? '';
  let matches = true;

  switch (filter.operator) {
    case 'member':
    case 'members':
    case '@':
      matches = matchesMemberFilter(
        value,
        context,
        precomputed.users,
        options,
        precomputed.currentUserId
      );
      break;
    case 'label':
    case '#':
      matches = matchesLabelFilter(value, context, precomputed.labelsByBoardId);
      break;
    case 'list':
      matches = matchesListFilter(value, context);
      break;
    case 'board':
      matches = matchesBoardFilter(value, context);
      break;
    // case "board":
    //   matches = matchesBoardFilter(value, context);
    //   break;
    case 'name':
      matches = matchesNameFilter(value, context);
      break;
    case 'description':
      matches = matchesDescriptionFilter(value, context);
      break;
    case 'comment':
      matches = matchesCommentFilter(value, context);
      break;
    case 'checklist':
      matches = matchesChecklistFilter(value, context);
      break;
    case 'has':
      matches = matchesHasFilter(value, context);
      break;
    case 'due':
      matches = matchesDueFilter(value, context);
      break;
    case 'edited':
      matches = matchesEditedFilter(value, context);
      break;
    case 'is':
      matches = matchesIsFilter(value, context);
      break;
    default:
      matches = true;
  }

  return filter.negated ? !matches : matches;
}

function boardMatchesFilters(board: Board, filters: SearchFilter[]): boolean {
  if (filters.length === 0) {
    return false;
  }

  return filters.every((filter) => {
    const normalizedValue = filter.value.trim().toLowerCase();
    let matches = true;

    switch (filter.operator) {
      case 'is':
        matches = matchesBoardIsFilter(normalizedValue, board);
        break;
      default:
        matches = true;
    }

    return filter.negated ? !matches : matches;
  });
}

export function executeSearch(
  state: TrelloStoreData,
  parsedQuery: ParsedSearch,
  options: SearchExecutionOptions = DEFAULT_OPTIONS
): SearchResults {
  const precomputed = buildPrecomputedState(state);
  const generalTokens = buildSearchTokens(parsedQuery.freeText, GENERAL_RULES);
  const boardQueryTokens = buildSearchTokens(parsedQuery.freeText, BOARD_RULES);

  const cardMatches: string[] = [];

  const recentBoards = state.search.recentBoards ?? [];
  const boardTitleMatches = new Set<string>();

  const relevantFilters = parsedQuery.filters ?? [];
  const hasBoardFilter = relevantFilters.some(
    (f) => f.operator === 'board' && f.value.trim().length > 0
  );
  const hasFreeText = parsedQuery.freeText.trim().length > 0;

  // Special rule: board:"name" alone should not yield results until a query
  // (free text after a space) is added. This mirrors Trello behavior.
  if (hasBoardFilter && !hasFreeText) {
    return { cards: [], lists: [], boards: [], totalCount: 0 };
  }

  const boardFilters = relevantFilters.filter((filter) => {
    if (filter.operator !== 'is') {
      return false;
    }
    return filter.value.trim().toLowerCase() === 'starred';
  });

  const hasBoardQueryTokens = boardQueryTokens.length > 0;

  Object.values(state.boards).forEach((board) => {
    const matchesGeneral = hasBoardQueryTokens && matchesTokens(boardQueryTokens, [board.title]);
    const matchesSpecific =
      boardFilters.length > 0 ? boardMatchesFilters(board, boardFilters) : false;
    const shouldInclude =
      (boardFilters.length === 0 && matchesGeneral) ||
      (boardFilters.length > 0 && matchesSpecific && (!hasBoardQueryTokens || matchesGeneral));
    if (shouldInclude) {
      boardTitleMatches.add(board.id);
    }
  });

  precomputed.cardContexts.forEach((context) => {
    // Exclude deleted cards and mirrors of deleted originals from search results
    const isDeleted = Boolean(context.card.deleted);
    const isMirrorOfDeleted =
      context.card.isMirror === true &&
      typeof context.card.mirrorOf === 'string' &&
      Boolean(state.cards[context.card.mirrorOf]?.deleted);
    if (isDeleted || isMirrorOfDeleted) {
      return;
    }
    const matchesGeneral = matchesTokens(generalTokens, [
      context.card.title,
      context.card.description ?? '',
    ]);

    const hasOperators = relevantFilters.length > 0;

    if (generalTokens.length > 0 && !matchesGeneral) {
      return;
    }

    const matchesFilters = relevantFilters.every((filter) =>
      evaluateCardFilter(filter, context, precomputed, options)
    );

    if (!matchesFilters) {
      return;
    }

    if (!hasOperators && generalTokens.length === 0) {
      return;
    }

    cardMatches.push(context.card.id);
  });

  let finalBoardMatches: string[];
  if (boardFilters.length > 0) {
    finalBoardMatches = Array.from(boardTitleMatches);
  } else {
    finalBoardMatches = Array.from(boardTitleMatches);
  }

  const totalCount = cardMatches.length + finalBoardMatches.length;

  const sortedCards = [...cardMatches]
    .sort((a, b) => {
      const cardA = state.cards[a];
      const cardB = state.cards[b];

      if (!cardA || !cardB) return 0;

      // Sort by creation date (newest first)
      const aCreated = new Date(cardA.createdAt || '').getTime();
      const bCreated = new Date(cardB.createdAt || '').getTime();
      return bCreated - aCreated;
    })
    .slice(0, 10); // Limit to 10 most recent cards

  const sortedBoards = [...finalBoardMatches].sort((a, b) => {
    const boardA = state.boards[a];
    const boardB = state.boards[b];

    if (!boardA || !boardB) return 0;

    return boardA.title.localeCompare(boardB.title);
  });

  return {
    cards: sortedCards,
    lists: [],
    boards: sortedBoards,
    totalCount,
  };
}
