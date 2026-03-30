import type {
  Board,
  Card,
  BoardUrlMetadata,
  CardUrlMetadata,
  BoardFilterOptions,
  Label,
  User,
} from '../types';

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function toBase62(value: number, length: number): string {
  const normalized = Math.abs(value);
  if (normalized === 0) {
    return BASE62_ALPHABET[0]?.repeat(length) ?? ''.padStart(length, '0');
  }

  let remaining = normalized;
  let out = '';
  while (remaining > 0 && out.length < length) {
    const index = remaining % BASE62_ALPHABET.length;
    out = `${BASE62_ALPHABET[index] ?? BASE62_ALPHABET[0] ?? '0'}${out}`;
    remaining = Math.floor(remaining / BASE62_ALPHABET.length);
  }

  if (out.length < length) {
    const padChar = BASE62_ALPHABET[0] ?? '0';
    out = padChar.repeat(length - out.length) + out;
  }

  return out.slice(-length);
}

export function generateDeterministicShortId(seed: string, length = 8): string {
  const hash = cyrb53(seed, seed.length);
  return toBase62(hash, length);
}

export function slugifyTitle(rawValue: string, fallback: string): string {
  const normalized = rawValue
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (normalized.length > 0) {
    return normalized;
  }

  const fallbackNormalized = fallback
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (fallbackNormalized.length > 0) {
    return fallbackNormalized;
  }

  return 'item';
}

export function getBoardShortId(board: Board): string {
  return generateDeterministicShortId(`board:${board.id}`);
}

export function getCardShortId(card: Card): string {
  return generateDeterministicShortId(`card:${card.id}`);
}

export function getBoardSlug(board: Board): string {
  return slugifyTitle(board.title, board.id);
}

export function getCardSlug(card: Card): string {
  return slugifyTitle(card.title, card.id);
}

export function ensureBoardUrlMetadata(board: Board): BoardUrlMetadata {
  // If valid metadata already exists, return it without recreating
  if (board.urlMetadata?.nextCardNumber != null && board.urlMetadata.nextCardNumber >= 1) {
    return board.urlMetadata;
  }

  const nextCardNumber = 1;
  const metadata: BoardUrlMetadata = {
    nextCardNumber,
  };

  if (Object.isExtensible(board)) {
    board.urlMetadata = metadata;
  }
  return metadata;
}

type AssignCardUrlMetadataOptions = {
  forceSequence?: boolean;
  skipSequence?: boolean;
};

export function assignCardUrlMetadata(
  card: Card,
  board: Board,
  options: AssignCardUrlMetadataOptions = {}
): CardUrlMetadata {
  const boardMetadata = ensureBoardUrlMetadata(board);

  if (options.skipSequence === true) {
    const mirrorMetadata: CardUrlMetadata = {
      boardId: board.id,
    };
    if (Object.isExtensible(card)) {
      card.urlMetadata = mirrorMetadata;
    }
    return mirrorMetadata;
  }

  const needsSequence =
    options.forceSequence === true ||
    card.urlMetadata?.number == null ||
    card.urlMetadata.boardId !== board.id;

  if (!needsSequence && card.urlMetadata) {
    return card.urlMetadata;
  }

  const assignedNumber = boardMetadata.nextCardNumber;
  boardMetadata.nextCardNumber = Math.max(assignedNumber + 1, 2);
  const metadata: CardUrlMetadata = {
    number: assignedNumber,
    boardId: board.id,
  };

  if (Object.isExtensible(card)) {
    card.urlMetadata = metadata;
  }
  return metadata;
}

export function stripCardUrlSequence(card: Card): void {
  if (!card.urlMetadata) {
    return;
  }

  const stripped: CardUrlMetadata = {
    boardId: card.urlMetadata.boardId ?? card.boardId,
  };
  if (Object.isExtensible(card)) {
    card.urlMetadata = stripped;
  }
}

export function getBoardRelativePath(board: Board): string {
  return `/b/${getBoardShortId(board)}/${getBoardSlug(board)}`;
}

export function getCardRelativePath(card: Card): string | null {
  if (card.isMirror === true) {
    return `/c/${getCardShortId(card)}`;
  }

  const metadata = card.urlMetadata;
  if (!metadata || metadata.number == null) {
    return null;
  }

  return `/c/${getCardShortId(card)}/${metadata.number}-${getCardSlug(card)}`;
}

type LabelsFilter = NonNullable<BoardFilterOptions['labels']>;
type MembersFilter = NonNullable<BoardFilterOptions['members']>;
type ActivityFilter = NonNullable<BoardFilterOptions['activity']>;

function getLabelsFilter(filters: BoardFilterOptions): LabelsFilter {
  return (
    filters.labels ?? {
      noLabels: false,
      selectedLabels: [],
      enableDropdown: false,
    }
  );
}

function getMembersFilter(filters: BoardFilterOptions): MembersFilter {
  return (
    filters.members ?? {
      noMembers: false,
      assignedToMe: false,
      selectedMembers: [],
      enableDropdown: false,
    }
  );
}

function getActivityFilter(filters: BoardFilterOptions): ActivityFilter {
  return (
    filters.activity ?? {
      lastWeek: false,
      lastTwoWeeks: false,
      lastFourWeeks: false,
      withoutActivity: false,
    }
  );
}

export type FilterSerializationContext = {
  labelsById: Record<string, Label | undefined>;
  usersById: Record<string, User | undefined>;
  currentUserId: string;
};

function formatLabelToken(label: Label): string {
  if (label.title && label.title.trim().length > 0) {
    return slugifyTitle(label.title, label.id);
  }
  if (label.color) {
    return slugifyTitle(label.color, label.id);
  }
  return slugifyTitle(label.id, label.id);
}

function formatMemberToken(memberId: string): string {
  return slugifyTitle(memberId, memberId);
}

function getLabelIdFromToken(token: string, context: FilterSerializationContext): string | null {
  const normalized = token.toLowerCase();
  for (const label of Object.values(context.labelsById)) {
    if (!label) continue;
    if (label.id.toLowerCase() === normalized) return label.id;
    const titleToken = slugifyTitle(label.title ?? '', label.id).toLowerCase();
    if (titleToken && titleToken === normalized) return label.id;
    const colorToken = slugifyTitle(label.color ?? '', label.id).toLowerCase();
    if (colorToken && colorToken === normalized) return label.id;
  }
  return null;
}

function getMemberIdFromToken(token: string, context: FilterSerializationContext): string | null {
  const normalized = token.toLowerCase();
  for (const user of Object.values(context.usersById)) {
    if (!user) continue;
    if (user.id.toLowerCase() === normalized) return user.id;
    const nameToken = slugifyTitle(user.displayName, user.id).toLowerCase();
    if (nameToken && nameToken === normalized) return user.id;
  }
  return null;
}

export function getBoardFilterTokens(
  filters: BoardFilterOptions,
  context: FilterSerializationContext
): string[] {
  const tokens: string[] = [];
  const labels = getLabelsFilter(filters);
  if (labels.noLabels) {
    tokens.push('label:none');
  }

  for (const labelId of labels.selectedLabels) {
    const label = context.labelsById[labelId];
    if (!label) continue;
    tokens.push(`label:${formatLabelToken(label)}`);
  }

  const members = getMembersFilter(filters);
  if (members.noMembers) {
    tokens.push('member:none');
  }

  if (members.assignedToMe) {
    tokens.push(`member:${formatMemberToken(context.currentUserId)}`);
  }

  for (const memberId of members.selectedMembers) {
    tokens.push(`member:${formatMemberToken(memberId)}`);
  }

  const activity = getActivityFilter(filters);
  if (activity.lastWeek) tokens.push('dateLastActivity:week');
  if (activity.lastTwoWeeks) tokens.push('dateLastActivity:twoWeeks');
  if (activity.lastFourWeeks) tokens.push('dateLastActivity:fourWeeks');
  if (activity.withoutActivity) tokens.push('dateLastActivity:month');

  if (filters.cardStatus.markedComplete) {
    tokens.push('dueComplete:true');
  }
  if (filters.cardStatus.notMarkedComplete) {
    tokens.push('dueComplete:false');
  }

  if (filters.dueDate.noDates) tokens.push('notDue:true');
  if (filters.dueDate.overdue) tokens.push('overdue:true');
  if (filters.dueDate.nextDay) tokens.push('due:day');
  if (filters.dueDate.nextWeek) tokens.push('due:week');
  if (filters.dueDate.nextMonth) tokens.push('due:month');

  return tokens;
}

export function buildBoardFilterValue(
  filters: BoardFilterOptions,
  context: FilterSerializationContext
): string | null {
  const tokens = getBoardFilterTokens(filters, context);
  if (tokens.length === 0) {
    return null;
  }
  return tokens.join(',');
}

export function buildCardFilterValue(
  filters: BoardFilterOptions,
  context: FilterSerializationContext
): string | null {
  const rawValue = buildBoardFilterValue(filters, context);
  if (!rawValue) {
    return null;
  }
  return encodeURIComponent(rawValue);
}

function createEmptyBoardFilters(): BoardFilterOptions {
  return {
    keyword: '',
    members: {
      noMembers: false,
      assignedToMe: false,
      selectedMembers: [],
      enableDropdown: false,
    },
    cardStatus: {
      markedComplete: false,
      notMarkedComplete: false,
    },
    dueDate: {
      noDates: false,
      overdue: false,
      nextDay: false,
      nextWeek: false,
      nextMonth: false,
    },
    labels: {
      noLabels: false,
      selectedLabels: [],
      enableDropdown: false,
    },
    activity: {
      lastWeek: false,
      lastTwoWeeks: false,
      lastFourWeeks: false,
      withoutActivity: false,
    },
    filterSnapshotCardIds: [],
  };
}

export function parseBoardFiltersFromQuery(
  filterValue: string | null | undefined,
  context: FilterSerializationContext
): BoardFilterOptions | null {
  if (!filterValue) {
    return null;
  }

  const tokens = filterValue
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return null;
  }

  const filters = createEmptyBoardFilters();
  const labels = filters.labels!;
  const members = filters.members!;
  const activity = filters.activity!;

  for (const token of tokens) {
    const [rawKey, rawValue] = token.split(':');
    const key = rawKey?.toLowerCase();
    const value = rawValue?.toLowerCase();
    if (!key || !value) {
      continue;
    }

    switch (key) {
      case 'label': {
        if (value === 'none') {
          labels.noLabels = true;
          break;
        }
        const match = getLabelIdFromToken(value, context);
        if (match && !labels.selectedLabels.includes(match)) {
          labels.selectedLabels.push(match);
        }
        break;
      }
      case 'member': {
        if (value === 'none') {
          members.noMembers = true;
          break;
        }
        const currentUserToken = formatMemberToken(context.currentUserId);
        if (value === currentUserToken) {
          members.assignedToMe = true;
          break;
        }
        const matchedMember = getMemberIdFromToken(value, context);
        if (matchedMember && !members.selectedMembers.includes(matchedMember)) {
          members.selectedMembers.push(matchedMember);
        }
        break;
      }
      case 'datelastactivity': {
        if (value === 'week') activity.lastWeek = true;
        if (value === 'twoweeks') activity.lastTwoWeeks = true;
        if (value === 'fourweeks') activity.lastFourWeeks = true;
        if (value === 'month') activity.withoutActivity = true;
        break;
      }
      case 'duecomplete': {
        if (value === 'true') filters.cardStatus.markedComplete = true;
        if (value === 'false') filters.cardStatus.notMarkedComplete = true;
        break;
      }
      case 'notdue': {
        if (value === 'true') filters.dueDate.noDates = true;
        break;
      }
      case 'overdue': {
        if (value === 'true') filters.dueDate.overdue = true;
        break;
      }
      case 'due': {
        if (value === 'day') filters.dueDate.nextDay = true;
        if (value === 'week') filters.dueDate.nextWeek = true;
        if (value === 'month') filters.dueDate.nextMonth = true;
        break;
      }
      default:
        break;
    }
  }

  return filters;
}
