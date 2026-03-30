import type { TrelloModifiers } from './modifiers';

export type ModifierControlType = 'checkbox' | 'select' | 'text';

export type ModifierConfig<T> = {
  key: keyof T;
  label: string;
  description: string;
  type: ModifierControlType;
  defaultValue: boolean | string | number;
  options?: Array<{ value: string | number; label: string }>; // For select type
};

export const trelloModifiersConfig: Array<ModifierConfig<TrelloModifiers>> = [
  {
    key: 'disabledSearch',
    label: 'Disabled Search',
    description: 'Disables the search bar functionality',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    key: 'onlyDragDrop',
    label: 'Only Drag and Drop',
    description:
      'Disables the ability to move cards through modals, requiring drag and drop instead',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    key: 'noDragDrop',
    label: 'No Drag and Drop',
    description:
      'Disables drag and drop functionality, requiring the use of buttons and modals instead',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    key: 'onlyHotkeys',
    label: 'Only Hotkeys',
    description:
      'Disables button clicks for actions that have keyboard shortcuts, requiring the use of hotkeys instead. Tooltips remain visible to show available shortcuts.',
    type: 'checkbox',
    defaultValue: false,
  },
];

export function getDefaultTrelloModifiers(): TrelloModifiers {
  const result: Record<string, unknown> = {};
  for (const config of trelloModifiersConfig) {
    result[config.key as string] = config.defaultValue;
  }
  return result as TrelloModifiers;
}
