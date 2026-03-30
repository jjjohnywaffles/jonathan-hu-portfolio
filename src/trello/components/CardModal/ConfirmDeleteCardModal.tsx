import React, { memo, useRef } from 'react';
import type { FC } from 'react';
import { CardModal } from '../ui/CardModal';
import { Button } from '../ui/Button';
import { ModalBackHeader } from '../ui/ModalBackHeader';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';

type ConfirmDeleteCardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  placement?:
    | 'bottom-start'
    | 'bottom-end'
    | 'bottom'
    | 'top-start'
    | 'top-end'
    | 'top'
    | 'right'
    | 'left'
    | 'center';
  // Optional overrides to reuse this modal for other delete confirmations
  titleText?: string;
  bodyText?: string;
  confirmButtonText?: string;
  offset?: number;
  lockOnOpen?: boolean;
  viewportPadding?: number;
  reflowOnScroll?: boolean;
  reflowOnResize?: boolean;
  reflowOnContentResize?: boolean;
  onBack?: () => void;
};

const ConfirmDeleteCardModal: FC<ConfirmDeleteCardModalProps> = memo(
  function ConfirmDeleteCardModal({
    isOpen,
    onClose,
    onConfirmDelete,
    buttonRef,
    placement = 'bottom-start',
    titleText,
    bodyText,
    confirmButtonText,
    offset,
    lockOnOpen,
    viewportPadding,
    reflowOnScroll,
    reflowOnResize,
    reflowOnContentResize,
    onBack,
  }) {
    const modalRef = useRef<HTMLDivElement>(null);

    const position = useAnchoredPosition({
      isOpen,
      anchorRef: buttonRef,
      contentRef: modalRef,
      placement,
      offset: offset ?? 8,
      lockOnOpen: lockOnOpen ?? false,
      fallbackWidth: 320,
      fallbackHeight: 200,
      viewportPadding: viewportPadding ?? 10,
      reflowOnScroll: reflowOnScroll ?? false,
      reflowOnResize: reflowOnResize ?? false,
      reflowOnContentResize: reflowOnContentResize ?? false,
    });

    const modalHeight = useDynamicModalHeight();

    const handleConfirm = () => {
      onConfirmDelete();
      onClose();
    };

    const title = titleText ?? 'Delete card?';
    const message =
      bodyText ??
      "All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.";
    const confirmText = confirmButtonText ?? 'Delete';

    return (
      <CardModal
        ref={modalRef}
        title={title}
        isOpen={isOpen}
        onClose={onClose}
        position={{ top: position.top, left: position.left }}
        dataAttribute="data-confirm-delete-card-modal"
        buttonRef={buttonRef}
        containerClassName={`z-[9999] ${modalHeight.modalContainerClasses}`}
        className={`origin-bottom ${modalHeight.modalClasses}`}
        usePortal
        customHeader={
          onBack ? <ModalBackHeader title={title} onBack={onBack} onClose={onClose} /> : undefined
        }
      >
        <div className={`space-y-4 p-3 ${modalHeight.contentClasses}`}>
          <p className="text-sm font-normal text-gray-700">{message}</p>
          <div className={modalHeight.footerClasses}>
            <Button
              onClick={handleConfirm}
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </CardModal>
    );
  }
);

export { ConfirmDeleteCardModal };
