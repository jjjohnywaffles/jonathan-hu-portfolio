import React, { memo, useMemo } from 'react';
import type { FC } from 'react';
import { CardModal } from '../../ui/CardModal';
import { AddToCardMenuItem, MENU_ITEMS } from './';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useIsCardInInbox } from '@trello/_lib/selectors';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';

type AddToCardModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  isTemplate?: boolean;
  onOpenLabelsModal: () => void;
  onOpenChecklistModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenMembersModal: () => void;
  onOpenCustomFieldModal: () => void;
};

const AddToCardModal: FC<AddToCardModalProps> = memo(function AddToCardModal({
  cardId,
  isOpen,
  onClose,
  buttonRef,
  isTemplate,
  onOpenLabelsModal,
  onOpenChecklistModal,
  onOpenCalendarModal,
  onOpenMembersModal,
  onOpenCustomFieldModal,
}) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const modalHeight = useDynamicModalHeight();
  const modalPosition = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackHeight: 300,
    fallbackWidth: 200,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Check if card is in inbox
  const isCardInInbox = useIsCardInInbox(cardId);
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');

  // Create menu items with handlers
  const menuItemsWithHandlers = useMemo(() => {
    const handlers = {
      labels: () => {
        onClose();
        onOpenLabelsModal();
      },
      dates: () => {
        onClose();
        onOpenCalendarModal();
      },
      checklist: () => {
        onClose();
        onOpenChecklistModal();
      },
      members: () => {
        onClose();
        onOpenMembersModal();
      },
      attachment: () => {
        onClose();
        // TODO: Implement attachment modal
      },
      customFields: () => {
        onClose();
        onOpenCustomFieldModal();
      },
    };

    return MENU_ITEMS.filter((item) => {
      // Hide dates option for template cards
      if (isTemplate && item.handlerKey === 'dates') {
        return false;
      }
      // Hide custom fields, labels, and members options for inbox cards
      if (
        isCardInInbox &&
        (item.handlerKey === 'customFields' ||
          item.handlerKey === 'labels' ||
          item.handlerKey === 'members')
      ) {
        return false;
      }
      return true;
    }).map((item) => ({
      ...item,
      onClick: handlers[item.handlerKey],
      // Disable items with shortcuts when onlyHotkeys modifier is enabled
      disabled: isOnlyHotkeys && item.shortcut != null,
    }));
  }, [
    onClose,
    onOpenLabelsModal,
    onOpenCalendarModal,
    onOpenChecklistModal,
    onOpenMembersModal,
    onOpenCustomFieldModal,
    isTemplate,
    isCardInInbox,
    isOnlyHotkeys,
  ]);

  if (!isOpen) return null;

  return (
    <CardModal
      ref={modalRef}
      title="Add to card"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: modalPosition.top, left: modalPosition.left }}
      dataAttribute="data-add-to-card-modal"
      buttonRef={buttonRef}
      containerClassName={modalHeight.modalContainerClasses}
      className={modalHeight.modalClasses}
    >
      {/* Content */}
      <div tabIndex={-1} className={modalHeight.contentClasses}>
        <div className="py-2">
          <ul>
            {menuItemsWithHandlers.map((item) => (
              <AddToCardMenuItem
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={item.onClick}
                testId={item.testId}
                ariaLabel={item.ariaLabel}
                disabled={item.disabled}
                shortcut={item.shortcut}
              />
            ))}
          </ul>
        </div>
      </div>
    </CardModal>
  );
});

export default AddToCardModal;
