import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { Tooltip } from '../Tooltip';
import { ModalBackHeader } from '../ui/ModalBackHeader';
import { IconEditLabel } from '@trello/components/icons/card-modal/icon-edit-label';
import {
  getLabelColorClass,
  getLabelColorDisplayName,
  sortLabelsByColor,
} from '@trello/utils/label-colors';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { CardModal, Input, IconButton } from '@trello/components/ui';
import { useCard, useLabels, useCardLabels, useTrelloOperations } from '@trello/_lib/selectors';

type LabelsModalProps = {
  cardId?: string;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onOpenCreateLabel: (buttonRef?: React.RefObject<HTMLButtonElement | null>) => void;
  onOpenEditLabel: (labelId: string, buttonElement?: HTMLButtonElement) => void;
  /** Whether the CreateLabelModal (child) is currently open. Used to block click-outside on this modal until the child closes. */
  isCreateLabelModalOpen?: boolean;
  buttonRef?: React.RefObject<HTMLElement | null>;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  /** Variant: 'card' shows checkboxes for toggling labels, 'board' shows labels without checkboxes */
  variant?: 'card' | 'board';
};

const LabelsModal: FC<LabelsModalProps> = memo(function LabelsModal({
  cardId,
  isOpen,
  onClose,
  onBack,
  onOpenCreateLabel,
  onOpenEditLabel,
  isCreateLabelModalOpen = false,
  buttonRef,
  modalRef: externalModalRef,
  variant = 'card',
}) {
  const card = useCard(cardId ?? '');
  const allLabels = useLabels();
  const cardLabels = useCardLabels(cardId ?? '');
  const { addLabelToCard, removeLabelFromCard } = useTrelloOperations();
  const internalModalRef = useRef<HTMLDivElement>(null);
  const modalRef = externalModalRef || internalModalRef;
  const createLabelButtonRef = useRef<HTMLButtonElement>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic modal sizing (defaults are sufficient once positioning clamps to viewport)
  const modalHeight = useDynamicModalHeight();

  // Unified anchored positioning with viewport clamping and reflow
  const anchored = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    viewportPadding: 10,
    fallbackWidth: 300,
    fallbackHeight: 420,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  const sortedLabels = useMemo(() => sortLabelsByColor(allLabels), [allLabels]);

  // Filter labels based on search term while preserving color order
  const filteredLabels = useMemo(() => {
    if (!searchTerm.trim()) return sortedLabels;

    const normalizedTerm = searchTerm.toLowerCase();

    return sortedLabels.filter(
      (label) => label.title && label.title.toLowerCase().includes(normalizedTerm)
    );
  }, [sortedLabels, searchTerm]);

  // Check if a label is assigned to the card
  const isLabelAssigned = (labelId: string): boolean => {
    return cardLabels.some((label) => label.id === labelId);
  };

  // Click outside handling is now managed by CardModal

  // Reset modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (variant === 'card' && !card) return null;

  const handleLabelToggle = (labelId: string) => {
    if (variant === 'card' && cardId) {
      if (isLabelAssigned(labelId)) {
        removeLabelFromCard({ cardId, labelId });
      } else {
        addLabelToCard({ cardId, labelId });
      }
    }
  };

  return (
    <CardModal
      ref={modalRef}
      title="Labels"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: anchored.top, left: anchored.left }}
      dataAttribute="data-labels-modal"
      buttonRef={buttonRef}
      childModals={[{ isOpen: isCreateLabelModalOpen }]}
      containerClassName={`${
        variant === 'board' ? 'z-[70]' : ''
      } ${modalHeight.modalContainerClasses}`}
      className={modalHeight.modalClasses}
      customHeader={
        onBack ? <ModalBackHeader title="Labels" onBack={onBack} onClose={onClose} /> : undefined
      }
    >
      {/* Scrollable Content */}
      <div className={modalHeight.contentClasses}>
        <div className="p-3 font-normal">
          {/* Search Input */}
          <div className="mb-2">
            <Input
              type="text"
              placeholder="Search labels…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search labels…"
              aria-describedby="search-helper"
            />
            <span id="search-helper" className="sr-only">
              Typing automatically updates the search results below
            </span>
          </div>

          {/* Labels Section */}
          <h3 className="mb-2 text-xs font-semibold text-gray-600">Labels</h3>

          {/* Labels List */}
          <div className="space-y-0">
            {filteredLabels.map((label) => {
              const trimmedTitle = label.title?.trim() ?? '';
              const colorName = getLabelColorDisplayName(label.color);
              const tooltipText = `Color: ${colorName}, title: "${trimmedTitle || 'none'}"`;

              return (
                <div
                  key={label.id}
                  className={`flex items-center justify-between rounded-sm px-2 py-0.5 ${variant === 'card' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {/* Checkbox - only show for card variant */}
                    {variant === 'card' && (
                      <input
                        type="checkbox"
                        checked={isLabelAssigned(label.id)}
                        onChange={() => handleLabelToggle(label.id)}
                        className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-checked={isLabelAssigned(label.id)}
                      />
                    )}

                    {/* Label Color and Text */}
                    <div className="min-w-0 flex-1">
                      <Tooltip
                        content={tooltipText}
                        position="bottom"
                        variant="dark"
                        delay={0}
                        fullWidth
                      >
                        <div
                          className={`flex h-8 min-w-0 flex-1 items-center justify-start overflow-hidden rounded-sm px-2 text-xs font-medium ${getLabelColorClass(label.color)} ${
                            label.color.endsWith('_dark') ? 'text-white' : 'text-black'
                          }`}
                          aria-label={tooltipText}
                          onClick={
                            variant === 'card' ? () => handleLabelToggle(label.id) : undefined
                          }
                          role={variant === 'card' ? 'button' : undefined}
                          tabIndex={variant === 'card' ? 0 : undefined}
                        >
                          <span className="truncate">{trimmedTitle}</span>
                        </div>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenEditLabel(label.id, e.currentTarget);
                    }}
                    className="ml-1 flex h-8 items-center justify-center rounded px-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    aria-label={`Edit Color: ${label.color}, title: ${label.title || 'none'}`}
                  >
                    <IconEditLabel className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className={modalHeight.footerClasses}>
        <div className="p-3 pt-0">
          {/* Create New Label Button */}
          <button
            ref={createLabelButtonRef}
            type="button"
            onClick={() => onOpenCreateLabel(createLabelButtonRef)}
            className="mt-3 w-full rounded-sm bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            aria-haspopup="dialog"
          >
            Create a new label
          </button>
        </div>
      </div>
    </CardModal>
  );
});

export { LabelsModal };
