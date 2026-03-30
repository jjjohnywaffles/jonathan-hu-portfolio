import { z } from 'zod';

export const trelloModifiersSchema = z.object({
  disabledSearch: z.boolean().optional(),
  onlyDragDrop: z.boolean().optional(),
  noDragDrop: z.boolean().optional(),
  onlyHotkeys: z.boolean().optional(),
});

export type TrelloModifiers = z.infer<typeof trelloModifiersSchema>;

export const TRELLO_MODIFIER_KEYS = [
  'disabledSearch',
  'onlyDragDrop',
  'noDragDrop',
  'onlyHotkeys',
] as const;

export function validateTrelloModifiers(
  modifiers: unknown
): { valid: true } | { valid: false; error: string } {
  const parseResult = trelloModifiersSchema.safeParse(modifiers);

  if (!parseResult.success) {
    return {
      valid: false,
      error: parseResult.error.message,
    };
  }

  if (!modifiers || typeof modifiers !== 'object') {
    return { valid: true };
  }

  const providedKeys = Object.keys(modifiers);
  const invalidKeys = providedKeys.filter(
    (key) => !TRELLO_MODIFIER_KEYS.includes(key as (typeof TRELLO_MODIFIER_KEYS)[number])
  );

  if (invalidKeys.length > 0) {
    return {
      valid: false,
      error: `Unknown trello modifiers: ${invalidKeys.join(', ')}. Valid modifiers: ${TRELLO_MODIFIER_KEYS.join(', ')}`,
    };
  }

  return { valid: true };
}
