// Custom hook that handles click-outside behavior for modals and popovers with escape key support and ref management
import { useEffect } from 'react';

type ModalState = {
  isOpen: boolean;
  wasOpenRef?: React.MutableRefObject<boolean>;
};

type UseModalClickOutsideProps = {
  isOpen: boolean;
  onClose: () => void;
  modalRef: React.RefObject<HTMLElement | null>;
  buttonRef?: React.RefObject<HTMLElement | null>;
  bottomNavRef?: React.RefObject<HTMLElement | null>;
  // Child modals that should block click handling when open
  childModals?: ModalState[];
  // Sibling modals that need race condition protection
  siblingModals?: ModalState[];
  // Additional cleanup when modal closes
  onCleanup?: () => void;
};

/**
 * Custom hook that provides click-outside handling for modals.
 * Prevents race conditions and handles nested modal scenarios.
 */
export function useModalClickOutside({
  isOpen,
  onClose,
  modalRef,
  buttonRef,
  bottomNavRef,
  childModals = [],
  siblingModals = [],
  onCleanup,
}: UseModalClickOutsideProps) {
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      // Check if any sibling modals are open (with race condition protection)
      for (const modal of siblingModals) {
        if (modal.isOpen || modal.wasOpenRef?.current) {
          // If modal was recently open, wait a bit before processing
          if (modal.wasOpenRef?.current && !modal.isOpen) {
            setTimeout(() => {
              if (modal.wasOpenRef) {
                modal.wasOpenRef.current = false;
              }
            }, 50);
          }
          return;
        }
      }

      // Check if any child modals are open (block all clicks)
      for (const modal of childModals) {
        if (modal.isOpen) {
          return;
        }
      }

      const target = e.target as Node;

      // Check for DOM-based modal detection (fallback protection)
      const modalSelectors = [
        '[data-move-modal]',
        '[data-copy-modal]',
        '[data-mirror-modal]',
        '[data-add-checklist-modal]',
        '[data-add-to-card-modal]',
        '[data-calendar-modal]',
        '[data-labels-modal]',
        '[data-create-label-modal]',
        '[data-active-field-editor-modal]',
        '[data-custom-fields-modal]',
        '[data-delete-field-modal]',
        '[data-confirm-delete-card-modal]',
        "[data-testid='list-action-modal']",
        '[data-session-task-helper]',
      ];

      // Check for dropdown portals (rendered outside modal DOM tree)
      const dropdownSelectors = [
        "[role='menu']", // Dropdown content containers
        '.dropdown-portal', // Custom dropdown portal class if needed
      ];

      for (const selector of modalSelectors) {
        const isModalClick = target instanceof Element && target.closest(selector);
        if (isModalClick) {
          return;
        }
      }

      // Check for dropdown clicks (prevent closing modal when interacting with dropdowns)
      for (const selector of dropdownSelectors) {
        const isDropdownClick = target instanceof Element && target.closest(selector);
        if (isDropdownClick) {
          return;
        }
      }

      // Check if click is inside this modal
      if (modalRef.current && modalRef.current.contains(target)) {
        return;
      }

      // Check if click is on the button that opened this modal
      if (buttonRef?.current && buttonRef.current.contains(target)) {
        return;
      }

      // Check if click is on bottom nav (for main card modals)
      if (bottomNavRef?.current && bottomNavRef.current.contains(target)) {
        return;
      }

      // Click is outside - close the modal
      onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Use capturing phase to ensure we get the event before other handlers
      document.addEventListener('mousedown', handleOutsideClick, true);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleOutsideClick, true);

      // Call cleanup if provided
      if (onCleanup) {
        onCleanup();
      }
    };
  }, [isOpen, onClose, modalRef, buttonRef, bottomNavRef, onCleanup, childModals, siblingModals]);
}
