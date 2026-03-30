import {
  type Card,
  type CustomFieldDefinition,
  type CustomFieldValue,
  type TrelloStoreData,
} from '@trello/_lib/types';
import {
  TrelloStoreDataParamsSchema,
  type TrelloStoreDataParams,
} from '@trello/_lib/initial-data/generate/types';
import { normalizeTrelloUrlMetadata, ensureInboxList } from '@trello/_lib/utils/url-normalizer';

const DEFAULT_BOARD_BACKGROUND = '#0079BF';

export function createTrelloDataset(
  params: TrelloStoreDataParams,
  // datetime is currently unused but kept for API parity
  // with other sites' dataset generators

  datetime?: string
): TrelloStoreData {
  const parseResult = TrelloStoreDataParamsSchema.safeParse(params);
  if (!parseResult.success) {
    const messages = parseResult.error.issues.map((issue) => issue.message);
    throw new Error(messages.join('; '));
  }
  const validated = parseResult.data;

  // Normalize users so that avatars are always rendered as
  // initials-only circles instead of pulling image file paths.
  const normalizedUsers: TrelloStoreData['users'] = {};

  for (const user of Object.values(validated.users)) {
    normalizedUsers[user.id] = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      // Intentionally omit avatar so UI falls back to initials.
    };
  }

  const currentUser = {
    ...validated.currentUser,
    // Intentionally omit avatar here as well.
    avatar: undefined,
  };
  const currentUserId = currentUser.id;

  // Ensure the current user exists in the users map
  normalizedUsers[currentUserId] = {
    id: currentUser.id,
    email: currentUser.email,
    displayName: currentUser.displayName,
  };

  const datasetWithNormalizedUsers: TrelloStoreData = {
    ...validated,
    users: normalizedUsers,
    currentUser,
  };
  const datasetWithNormalizedBoards: TrelloStoreData = {
    ...datasetWithNormalizedUsers,
    boards: normalizeBoardBackgrounds(datasetWithNormalizedUsers.boards),
  };

  const datasetWithNormalizedCards: TrelloStoreData = {
    ...datasetWithNormalizedBoards,
    cards: normalizeCardsWithBoardCustomFields(datasetWithNormalizedBoards),
  };

  ensureInboxList(datasetWithNormalizedCards);
  return normalizeTrelloUrlMetadata(datasetWithNormalizedCards);
}

function normalizeBoardBackgrounds(boards: TrelloStoreData['boards']): TrelloStoreData['boards'] {
  const normalizedBoards: TrelloStoreData['boards'] = {};

  for (const [boardId, board] of Object.entries(boards)) {
    normalizedBoards[boardId] = {
      ...board,
      background: DEFAULT_BOARD_BACKGROUND,
    };
  }

  return normalizedBoards;
}

function normalizeCardsWithBoardCustomFields({
  boards,
  cards,
  customFieldDefinitions,
}: Pick<TrelloStoreData, 'boards' | 'cards' | 'customFieldDefinitions'>): TrelloStoreData['cards'] {
  const normalizedCards: TrelloStoreData['cards'] = {};

  for (const [cardId, card] of Object.entries(cards)) {
    const board = boards[card.boardId];
    if (!board) {
      normalizedCards[cardId] = card;
      continue;
    }

    const boardDefinitions = board.customFieldDefinitionIds
      .map((definitionId) => customFieldDefinitions[definitionId])
      .filter((definition): definition is CustomFieldDefinition => definition != null);

    if (boardDefinitions.length === 0) {
      normalizedCards[cardId] = card;
      continue;
    }

    const normalizedCard: Card = { ...card };
    const shouldSuppressCustomFields =
      card.customFields == null && card.preservedCustomFields != null;

    if (!shouldSuppressCustomFields) {
      const normalizedCustomFields = normalizeCustomFieldValues(
        card.customFields,
        boardDefinitions
      );
      normalizedCard.customFields =
        normalizedCustomFields.length > 0 ? normalizedCustomFields : undefined;
    }

    if (card.preservedCustomFields) {
      const normalizedPreservedFields = normalizeCustomFieldValues(
        card.preservedCustomFields,
        boardDefinitions
      );
      normalizedCard.preservedCustomFields =
        normalizedPreservedFields.length > 0 ? normalizedPreservedFields : undefined;
    }

    normalizedCards[cardId] = normalizedCard;
  }

  return normalizedCards;
}

function normalizeCustomFieldValues(
  existingValues: CustomFieldValue[] | undefined,
  definitions: CustomFieldDefinition[]
): CustomFieldValue[] {
  if (definitions.length === 0) {
    return [];
  }

  const valuesById = new Map((existingValues ?? []).map((field) => [field.id, field.value]));

  return definitions.map((definition) => {
    return {
      id: definition.id,
      value: valuesById.get(definition.id),
    };
  });
}
