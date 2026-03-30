import type { TrelloStoreData } from '../types';
import mergedDataset from './datasets/merged.json';
import { createTrelloDataset } from './generate';
import { TrelloStoreDataParamsBaseSchema } from './generate/types';

let cached: TrelloStoreData | null = null;

export async function getInitialTrelloData(): Promise<TrelloStoreData> {
  if (cached) return cached;
  cached = createTrelloDataset(TrelloStoreDataParamsBaseSchema.strict().parse(mergedDataset));
  return cached;
}
