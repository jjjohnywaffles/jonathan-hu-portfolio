import React, { memo, forwardRef } from 'react';
import type { ReactNode } from 'react';
import { IconClose } from '../icons/card-modal/icon-close';
import { useModalClickOutside } from '../../hooks/use-modal-click-outside';
import { Button } from './Button';
import { PopoverModal } from './PopoverModal';
import { cn } from '@trello/_lib/shims/utils';

type ModalState = {
  isOpen: boolean;
  wasOpenRef?: React.MutableRefObject<boolean>;
};

type CardModalProps = {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  className?: string;
  dataAttribute?: string;
  showDivider?: boolean;
  showCloseButton?: boolean;
  showHeader?: boolean;
  buttonRef?: React.RefObject<HTMLElement | null>;
  childModals?: ModalState[];
  containerClassName?: string;
  customHeader?: ReactNode;
  usePortal?: boolean;
  portalContainer?: Element | null;
};

const CardModal = memo(
  forwardRef<HTMLDivElement, CardModalProps>(function CardModal(
    {
      children,
      title,
      isOpen,
      onClose,
      position,
      className,
      dataAttribute,
      showDivider = false,
      showCloseButton = true,
      showHeader = true,
      buttonRef,
      childModals = [],
      containerClassName,
      customHeader,
      usePortal = false,
      portalContainer,
    },
    ref
  ) {
    const modalProps = dataAttribute ? { [dataAttribute]: true } : {};

    // Universal click outside handling
    useModalClickOutside({
      isOpen,
      onClose,
      modalRef: ref as React.RefObject<HTMLElement | null>,
      buttonRef,
      childModals,
    });

    return (
      <PopoverModal
        ref={ref}
        isOpen={isOpen}
        position={position}
        className={cn('w-80', className)}
        containerClassName={containerClassName}
        usePortal={usePortal}
        portalContainer={portalContainer}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        {...modalProps}
      >
        {/* Header */}
        {showHeader && (
          <header
            className={cn(
              'relative flex items-center justify-center p-3',
              showDivider && 'border-b border-gray-200'
            )}
          >
            {customHeader ? (
              customHeader
            ) : (
              <>
                <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
                {showCloseButton && (
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    aria-label="Close popover"
                  >
                    <IconClose className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </header>
        )}

        {/* Content */}
        {children}
      </PopoverModal>
    );
  })
);

export { CardModal };
