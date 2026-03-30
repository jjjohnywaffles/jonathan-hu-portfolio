export const zIndices = {
  overlay: 50,
  dropdownPortal: 60,
  modal: 70,
  elevatedModal: 75,
  blockingModal: 80,
  tooltip: 9999,
} as const;

export type ZIndexKey = keyof typeof zIndices;
