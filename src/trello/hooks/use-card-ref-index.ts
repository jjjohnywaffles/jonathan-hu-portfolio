import type { CardRef } from '@trello/_lib/types';

/**
 * Get the actual index of a card in a list's cardRefs array
 * Returns -1 if not found
 *
 * @param cardId - The ID of the card to find
 * @param cardRefs - The array of card references to search
 * @param isMirror - Whether to look for a mirror or original card (important when both exist in same list)
 */
export function getCardRefIndex(
  cardId: string,
  cardRefs: CardRef[] | undefined,
  _isMirror?: boolean
): number {
  if (!cardRefs) return -1;
  return cardRefs.findIndex((ref) => ref.cardId === cardId);
}
