import { create } from 'zustand';

type GlobalModifiers = Record<string, unknown>;

export const useGlobalModifiersStore = create<GlobalModifiers>(() => ({}));

export function initializeGlobalModifiers(modifiers: unknown): void {
  if (modifiers && typeof modifiers === 'object') {
    useGlobalModifiersStore.setState(modifiers as GlobalModifiers);
  }
}
