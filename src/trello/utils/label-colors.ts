/**
 * Available colors organized in rows for the color picker UI
 */
export const colorOptions = [
  // First row
  ['green_light', 'yellow_light', 'orange_light', 'red_light', 'purple_light'],
  // Second row
  ['green', 'yellow', 'orange', 'red', 'purple'],
  // Third row
  ['green_dark', 'yellow_dark', 'orange_dark', 'red_dark', 'purple_dark'],
  // Fourth row (with different colors)
  ['blue_light', 'sky_light', 'lime_light', 'pink_light', 'black_light'],
  // Fifth row
  ['blue', 'sky', 'lime', 'pink', 'black'],
  // Sixth row
  ['blue_dark', 'sky_dark', 'lime_dark', 'pink_dark', 'black_dark'],
];

/**
 * Display names for label colors, matching the provided palette terminology.
 * Keys correspond to colorOptions entries.
 */
export const colorDisplayNames: Record<string, string> = {
  // Row 1: subtle variants
  green_light: 'Subtle Green',
  yellow_light: 'Subtle Yellow',
  orange_light: 'Subtle Orange',
  red_light: 'Subtle Red',
  purple_light: 'Subtle Purple',
  // Row 2: base variants
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  purple: 'Purple',
  // Row 3: bold variants
  green_dark: 'Bold Green',
  yellow_dark: 'Bold Yellow',
  orange_dark: 'Bold Orange',
  red_dark: 'Bold Red',
  purple_dark: 'Bold Purple',
  // Row 4: subtle extended
  blue_light: 'Subtle Blue',
  sky_light: 'Subtle Sky',
  lime_light: 'Subtle Lime',
  pink_light: 'Subtle Pink',
  black_light: 'Subtle Black',
  // Row 5: base extended
  blue: 'Blue',
  sky: 'Sky',
  lime: 'Lime',
  pink: 'Pink',
  black: 'Black',
  // Row 6: bold extended
  blue_dark: 'Bold Blue',
  sky_dark: 'Bold Sky',
  lime_dark: 'Bold Lime',
  pink_dark: 'Bold Pink',
  black_dark: 'Bold Black',
};

/**
 * Utility function to get Tailwind CSS background color classes for label colors
 * @param color - The label color string (e.g., 'green', 'green_light', 'green_dark')
 * @returns The corresponding Tailwind CSS background color class
 */
export function getLabelColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    // Row 1: subtle variants
    green_light: 'bg-[#baf3db]',
    yellow_light: 'bg-[#f5e989]',
    orange_light: 'bg-[#fce4a6]',
    red_light: 'bg-[#ffd5d2]',
    purple_light: 'bg-[#eed7fc]',
    // Row 2: base variants
    green: 'bg-[#4cce97]',
    yellow: 'bg-[#eed12a]',
    orange: 'bg-[#fca701]',
    red: 'bg-[#f87168]',
    purple: 'bg-[#c97cf4]',
    // Row 3: bold variants
    green_dark: 'bg-[#20845a]',
    yellow_dark: 'bg-[#946f01]',
    orange_dark: 'bg-[#be5a00]',
    red_dark: 'bg-[#c9372c]',
    purple_dark: 'bg-[#964ac0]',
    // Row 4: subtle extended
    blue_light: 'bg-[#cfe1fd]',
    sky_light: 'bg-[#c6edfb]',
    lime_light: 'bg-[#d3f1a7]',
    pink_light: 'bg-[#fdd0ec]',
    black_light: 'bg-[#dddee1]',
    // Row 5: base extended
    blue: 'bg-[#659df1]',
    sky: 'bg-[#6cc3e0]',
    lime: 'bg-[#94c747]',
    pink: 'bg-[#e774bb]',
    black: 'bg-[#8b8f97]',
    // Row 6: bold extended
    blue_dark: 'bg-[#1868dc]',
    sky_dark: 'bg-[#227d9b]',
    lime_dark: 'bg-[#5c7f24]',
    pink_dark: 'bg-[#ad4787]',
    black_dark: 'bg-[#6c6e76]',
  };
  return colorMap[color] || 'bg-gray-400';
}

/**
 * Returns a human-readable display name including strength for a label color key.
 * Examples: 'green_light' -> 'Subtle Green', 'yellow_dark' -> 'Bold Yellow', 'orange' -> 'Orange'.
 */
export function getLabelColorDisplayName(color: string): string {
  return colorDisplayNames[color] ?? color;
}

const baseColorOrder = [
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
] as const;

const variantOrder = {
  light: 0,
  base: 1,
  dark: 2,
} as const;

type VariantKey = keyof typeof variantOrder;

export function getLabelColorSortKey(color: string): {
  baseIndex: number;
  variantIndex: number;
} {
  let variant: VariantKey = 'base';
  let baseColor = color;

  if (color.endsWith('_light')) {
    variant = 'light';
    baseColor = color.replace(/_light$/, '');
  } else if (color.endsWith('_dark')) {
    variant = 'dark';
    baseColor = color.replace(/_dark$/, '');
  }

  const baseIndex = baseColorOrder.findIndex((orderedColor) => orderedColor === baseColor);

  return {
    baseIndex: baseIndex === -1 ? Number.MAX_SAFE_INTEGER : baseIndex,
    variantIndex: variantOrder[variant],
  };
}

export function sortLabelsByColor<T extends { color: string }>(labels: readonly T[]): T[] {
  return labels
    .map((label, index) => {
      const sortKey = getLabelColorSortKey(label.color);
      const rawTitle =
        typeof (label as { title?: string }).title === 'string'
          ? ((label as { title?: string }).title ?? '')
          : '';
      const title = rawTitle.trim();
      return {
        label,
        index,
        baseIndex: sortKey.baseIndex,
        variantIndex: sortKey.variantIndex,
        untitledRank: title.length > 0 ? 1 : 0,
        titleKey: title.length > 0 ? title.toLowerCase() : '',
      };
    })
    .sort((a, b) => {
      if (a.baseIndex !== b.baseIndex) {
        return a.baseIndex - b.baseIndex;
      }
      if (a.variantIndex !== b.variantIndex) {
        return a.variantIndex - b.variantIndex;
      }
      if (a.untitledRank !== b.untitledRank) {
        return a.untitledRank - b.untitledRank;
      }
      if (a.titleKey !== b.titleKey) {
        return a.titleKey.localeCompare(b.titleKey);
      }
      return a.index - b.index;
    })
    .map((entry) => entry.label);
}
