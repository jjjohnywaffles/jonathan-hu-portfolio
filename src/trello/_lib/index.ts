import { produce } from 'immer';
import { getInitialTrelloData } from './initial-data';
import { trelloStoreOperationDefinitions } from './operations';
import { ensureInboxList, normalizeTrelloUrlMetadata } from './utils/url-normalizer';
import { createSyncedMockBackendStore } from '@trello/_lib/shims/store-factory';

async function getNormalizedInitialData() {
  const data = await getInitialTrelloData();
  return produce(data, (draft) => {
    normalizeTrelloUrlMetadata(draft);
    ensureInboxList(draft);
  });
}

export const trelloMockBackend = createSyncedMockBackendStore(
  'trello',
  getNormalizedInitialData,
  trelloStoreOperationDefinitions
);

export const useTrelloStore = trelloMockBackend.store;
export async function initializeTrelloStore(): Promise<void> {
  await trelloMockBackend.initialize();
}

// Export suggested field templates for external use
export { SUGGESTED_FIELD_TEMPLATES } from './suggested-field-templates';
