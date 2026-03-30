import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { IconBack } from '../icons/card-modal/icon-back';
import {
  getLabelColorClass,
  colorOptions,
  getLabelColorDisplayName,
} from '../../utils/label-colors';
import { CardModal } from '../ui/CardModal';
import { ModalBackHeader } from '../ui/ModalBackHeader';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useTrelloOperations, useLabels, useCardLabels } from '@trello/_lib/selectors';

type CreateLabelModalProps = {
  cardId?: string;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  editLabelId?: string; // If provided, we're editing an existing label
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  initialTitle?: string;
  initialColor?: string;
  variant?: 'card' | 'board'; // Board variant doesn't need cardId
  labelsModalRef?: React.RefObject<HTMLDivElement | null>; // For board variant positioning
  labelsModalPosition?: { top: number; left: number } | null;
};

const CreateLabelModal: FC<CreateLabelModalProps> = memo(function CreateLabelModal({
  cardId,
  isOpen,
  onClose,
  onBack,
  editLabelId,
  buttonRef,
  modalRef: externalModalRef,
  initialTitle = '',
  initialColor,
  variant = 'card',
  labelsModalRef,
  labelsModalPosition,
}) {
  const { createLabel, updateLabel, addLabelToCard, deleteLabel, removeLabelFromCard } =
    useTrelloOperations();
  const allLabels = useLabels(); // Get all labels for duplicate checking
  const cardLabels = useCardLabels(cardId ?? ''); // Get current card labels for toggle logic
  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalRef = externalModalRef || internalModalRef;
  const [isDeleteView, setIsDeleteView] = useState(false);

  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('lime');
  const hookPosition = useAnchoredPosition({
    isOpen,
    anchorRef: labelsModalRef?.current ? undefined : variant === 'card' ? buttonRef : undefined,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 350,
    fallbackWidth: 300,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Position directly on top of the labels modal when available, otherwise use dynamic positioning
  const resolvedLabelsModalPosition = (() => {
    if (labelsModalRef?.current) {
      const rect = labelsModalRef.current.getBoundingClientRect();
      if (rect.top >= 0 && rect.left >= 0) {
        return { top: rect.top, left: rect.left };
      }
    }
    return labelsModalPosition ?? null;
  })();

  const modalPosition = resolvedLabelsModalPosition ?? hookPosition;
  const modalHeight = useDynamicModalHeight();

  // Click outside handling is now managed by CardModal

  // Reset modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setSelectedColor('lime');
      setIsDeleteView(false);
    }
  }, [isOpen]);

  // Set initial values when editing
  useEffect(() => {
    if (editLabelId && isOpen) {
      setTitle(initialTitle ?? '');
      setSelectedColor(initialColor ?? 'lime');
    }
  }, [editLabelId, isOpen, initialTitle, initialColor]);

  const handleConfirmDelete = () => {
    if (editLabelId == null) {
      return;
    }

    deleteLabel({ labelId: editLabelId });
    setIsDeleteView(false);
    // Return to previous modal (labels list) if available
    if (onBack && variant === 'card') {
      onBack();
    } else {
      onClose();
    }
  };

  const handleCreate = useCallback(() => {
    if (editLabelId) {
      updateLabel({
        labelId: editLabelId,
        updates: { title: title.trim() || undefined, color: selectedColor },
      });
    } else {
      // Check for duplicate label (same color and title)
      const trimmedTitle = title.trim() || undefined;
      const isDuplicate = allLabels.some(
        (label) => label.color === selectedColor && label.title === trimmedTitle
      );

      // If duplicate exists, handle based on whether it's a color-only label
      if (isDuplicate) {
        // Special case: color-only label toggle for card variant
        if (trimmedTitle === undefined && cardId && variant === 'card') {
          // Find the existing color-only label
          const existingLabel = allLabels.find(
            (label) => label.color === selectedColor && label.title === undefined
          );

          if (existingLabel) {
            // Check if this label is already on the card
            const isLabelOnCard = cardLabels.some((label) => label.id === existingLabel.id);

            // Toggle: remove if present, add if not present
            if (isLabelOnCard) {
              removeLabelFromCard({ cardId, labelId: existingLabel.id });
            } else {
              addLabelToCard({ cardId, labelId: existingLabel.id });
            }
          }
        }
        // For titled labels or board variant, just close modal (existing behavior)
      } else {
        // No duplicate - create new label
        const newLabelId = createLabel({
          title: trimmedTitle,
          color: selectedColor,
        });
        // Auto-select the newly created label (only for card variant)
        if (newLabelId && cardId && variant === 'card') {
          addLabelToCard({ cardId, labelId: newLabelId });
        }
      }
    }

    // Call onBack for card variant, onClose for board variant
    if (onBack && variant === 'card') {
      onBack();
    } else {
      onClose();
    }
  }, [
    editLabelId,
    updateLabel,
    title,
    selectedColor,
    allLabels,
    cardId,
    variant,
    removeLabelFromCard,
    addLabelToCard,
    createLabel,
    onBack,
    onClose,
    cardLabels,
  ]);

  const handleRemoveColor = () => {
    setSelectedColor('');
  };

  const getSimpleColorName = (color: string): string => {
    return color.replace(/_light|_dark/, '');
  };

  const modalTitle = isDeleteView ? 'Delete label' : editLabelId ? 'Edit label' : 'Create label';

  // Pressing Enter anywhere in this modal (when not in delete view) should save/create
  useEffect(() => {
    if (!isOpen || isDeleteView) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleteView, handleCreate]);

  return (
    <CardModal
      ref={modalRef}
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      dataAttribute="data-create-label-modal"
      buttonRef={buttonRef}
      containerClassName={`z-[80] ${modalHeight.modalContainerClasses}`}
      className={`font-normal ${modalHeight.modalClasses}`}
      customHeader={
        isDeleteView ? (
          <ModalBackHeader
            title={modalTitle}
            onBack={() => setIsDeleteView(false)}
            onClose={onClose}
          />
        ) : undefined
      }
    >
      {/* Custom back button overlay - only for card variant */}
      {onBack && variant === 'card' && !isDeleteView && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={onBack}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Return to previous screen"
          >
            <IconBack className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content */}
      {isDeleteView ? (
        <div className={`px-3 py-2 font-normal ${modalHeight.contentClasses}`}>
          <p className="text-sm text-gray-700">
            This will remove this label from all cards. There is no undo.
          </p>
        </div>
      ) : (
        <div className={`px-3 py-2 font-normal ${modalHeight.contentClasses}`}>
          {/* Color Preview */}
          <div className="mb-2 flex justify-center">
            <div
              className={`h-8 w-4/5 min-w-0 rounded-sm ${getLabelColorClass(selectedColor)} flex items-center justify-start px-2 text-xs font-medium ${
                selectedColor.endsWith('_dark') ? 'text-white' : 'text-black'
              }`}
              title={getLabelColorDisplayName(selectedColor)}
              aria-label={`Color: ${getSimpleColorName(selectedColor)}, title: ${title || 'none'}`}
            >
              <span className="max-w-full truncate">{title || ''}</span>
            </div>
            <span className="sr-only" aria-live="polite" role="status">
              The label color was selected
            </span>
          </div>

          {/* Title Input */}
          <div className="mb-2">
            <h3 className="mb-0.5 text-xs font-semibold text-gray-600 uppercase">
              <label htmlFor="edit-label-title-input">Title</label>
            </h3>
            <input
              type="text"
              id="edit-label-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Color Selection */}
          <div className="mb-2">
            <h3 className="mb-1 text-xs font-semibold text-gray-600 uppercase">Select a color</h3>
            <div role="radiogroup" data-testid="color-palette">
              <div className="space-y-0.5">
                {colorOptions.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-0.5">
                    {row.map((color) => (
                      <div key={color} className="group relative flex-1">
                        <button
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`h-8 w-full cursor-pointer rounded ${getLabelColorClass(color)} border transition-all ${
                            selectedColor === color
                              ? 'border-blue-600 ring-1 ring-blue-300'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          aria-label={getLabelColorDisplayName(color)}
                          title={getLabelColorDisplayName(color)}
                          aria-checked={selectedColor === color}
                          role="radio"
                        />
                        <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded bg-black px-2 py-0.5 text-xs whitespace-nowrap text-white opacity-0 group-hover:opacity-100">
                          {getLabelColorDisplayName(color)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Remove Color Button */}
          {selectedColor && (
            <button
              type="button"
              onClick={handleRemoveColor}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-sm bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              × Remove color
            </button>
          )}
        </div>
      )}

      {/* Fixed Footer */}
      {isDeleteView ? (
        <div className={modalHeight.footerClasses}>
          <div className="px-3 pt-2 pb-3">
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="w-full rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className={modalHeight.footerClasses}>
          <div className="flex items-center justify-between px-3 py-2">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              {editLabelId ? 'Save' : 'Create'}
            </button>
            {editLabelId ? (
              <button
                type="button"
                onClick={() => setIsDeleteView(true)}
                className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </CardModal>
  );
});

export { CreateLabelModal };
