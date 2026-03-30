import type { TrelloModifiers } from '../modifiers';
import { useGlobalModifiersStore } from '@trello/_lib/shims/modifiers-store';

export function useTrelloModifiers(): TrelloModifiers {
  return useGlobalModifiersStore((state) => state as TrelloModifiers);
}

export function useIsModifierEnabled(modifier: keyof TrelloModifiers): boolean {
  return useGlobalModifiersStore((state) => (state[modifier] ?? false) === true);
}
