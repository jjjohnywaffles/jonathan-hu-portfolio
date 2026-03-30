import React, { memo, useEffect } from 'react';
import type { FC } from 'react';
import { CardModal } from '../../ui/CardModal';
import { Tooltip } from '../../Tooltip';
import {
  colorOptions as labelColorOptions,
  getLabelColorClass,
  getLabelColorDisplayName,
} from '@trello/utils/label-colors';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';

type ColorPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  currentColor?: string;
};

// Color options for the picker – base label colors only (3 rows x 4 cols, last slot empty)
const COLOR_OPTIONS = [
  // Row 1
  null, // None
  '#4cce97', // Green
  '#eed12a', // Yellow
  '#fca701', // Orange
  // Row 2
  '#f87168', // Red
  '#c97cf4', // Purple
  '#659df1', // Blue
  '#6cc3e0', // Sky
  // Row 3
  '#94c747', // Lime
  '#e774bb', // Pink
  '#8b8f97', // Black
  // (last spot intentionally empty to keep grid alignment)
];

const ColorPickerModal: FC<ColorPickerModalProps> = memo(function ColorPickerModal({
  isOpen,
  onClose,
  onColorSelect,
  buttonRef,
  modalRef: externalModalRef,
  currentColor,
}) {
  function getColorName(hex: string | null): string {
    if (hex == null || hex === '') return 'None';
    const keys = labelColorOptions.flat();
    for (const key of keys) {
      const cls = getLabelColorClass(key);
      if (cls.includes(hex)) {
        return getLabelColorDisplayName(key);
      }
    }
    return hex;
  }
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const modalEl = externalModalRef?.current as HTMLElement | null;
      const triggerEl = buttonRef?.current as HTMLElement | null;
      if (modalEl && !modalEl.contains(target) && (!triggerEl || !triggerEl.contains(target))) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, [isOpen, onClose, externalModalRef, buttonRef]);
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: externalModalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 120,
    fallbackWidth: 200,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  const handleColorClick = (color: string | null) => {
    onColorSelect(color ?? '');
    onClose();
  };

  return (
    <CardModal
      ref={externalModalRef}
      title=""
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      className={`w-48 [&>header]:hidden ${modalHeight.modalClasses}`}
      containerClassName={`z-[80] ${modalHeight.modalContainerClasses}`}
      dataAttribute="data-color-picker-modal"
      buttonRef={buttonRef}
    >
      <div className={`p-3 ${modalHeight.contentClasses}`}>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_OPTIONS.map((color, index) => (
            <Tooltip key={index} content={getColorName(color)} position="bottom" variant="dark">
              <button
                type="button"
                className={`h-8 w-8 cursor-pointer rounded border-2 transition-all duration-150 hover:scale-110 ${
                  currentColor === (color ?? '')
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-300 hover:border-gray-400'
                } ${color === null ? 'relative bg-white' : ''} `}
                style={color ? { backgroundColor: color } : {}}
                onClick={() => handleColorClick(color)}
                aria-label={getColorName(color)}
              >
                {color === null && (
                  // Diagonal line through no-color option
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-px w-6 rotate-45 transform bg-red-500"
                      style={{ width: '20px' }}
                    />
                  </div>
                )}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </CardModal>
  );
});

export { ColorPickerModal };
