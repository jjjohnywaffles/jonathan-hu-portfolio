import React, { memo, useRef } from 'react';
import type { FC } from 'react';
import { CardModal } from '../ui';
import { IconCustomFields } from '../icons/card-modal/icon-custom-fields';
import { IconLabel } from '../icons/card-modal/icon-label';
import { IconArchive } from '../icons/card-modal-action/icon-archive';
import { IconCollapse } from '../icons/list/icon-collapse';
import { IconExpand } from '../icons/list/icon-expand';
import { IconCopyBoard } from '../icons/board/icon-copy-board';
import { useTrelloUI } from '../TrelloUIContext';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useTrelloOperations, useAreAllListsCollapsed } from '@trello/_lib/selectors';

type BoardMenuModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
};

const BoardMenuModal: FC<BoardMenuModalProps> = memo(function BoardMenuModal({
  isOpen,
  onClose,
  buttonRef,
}) {
  const {
    openBoardCustomFieldsModal,
    openBoardLabelsModal,
    openBoardArchivedCardsModal,
    openBoardCopyModal,
    isBoardCustomFieldsModalOpen,
    isBoardLabelsModalOpen,
    isBoardCreateLabelModalOpen,
    isBoardCopyModalOpen,
  } = useTrelloUI();
  const { collapseAllLists, expandAllLists } = useTrelloOperations();
  const areAllListsCollapsed = useAreAllListsCollapsed();
  const modalRef = useRef<HTMLDivElement>(null);
  const customFieldsButtonRef = useRef<HTMLButtonElement>(null);

  // Use unified anchored positioning
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-end',
    offset: 8,
    fallbackWidth: 340,
    fallbackHeight: 350,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  const handleCustomFields = (e: React.MouseEvent<HTMLButtonElement>) => {
    openBoardCustomFieldsModal(e.currentTarget);
    // Don't close the board menu modal so it stays accessible
  };

  const handleLabels = () => {
    openBoardLabelsModal();
    // Don't close the board menu modal so it stays accessible
  };

  const handleArchivedItems = () => {
    openBoardArchivedCardsModal();
    onClose(); // Close the board menu modal
  };

  const handleToggleAllLists = () => {
    if (areAllListsCollapsed) {
      expandAllLists();
    } else {
      collapseAllLists();
    }
    // Don't close the modal so users can see the effect and perform more actions
  };

  const handleCopyBoard = () => {
    openBoardCopyModal();
    // Keep the board menu modal open so it stays accessible
  };

  const MenuItem: FC<{
    onClick: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
  }> = ({ onClick, children, icon, className = '' }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-normal text-gray-700 transition-colors hover:bg-gray-100 ${className}`}
    >
      {icon && <span className="text-gray-500">{icon}</span>}
      {children}
    </button>
  );

  return (
    <CardModal
      ref={modalRef}
      title="Menu"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: position.top, left: position.left }}
      buttonRef={buttonRef}
      dataAttribute="data-board-menu-modal"
      containerClassName={`z-[60] ${modalHeight.modalContainerClasses}`}
      className={`!w-[340px] ${modalHeight.modalClasses}`}
      childModals={[
        // Keep board menu open while interacting with these child modals
        { isOpen: isBoardCustomFieldsModalOpen },
        { isOpen: isBoardLabelsModalOpen },
        { isOpen: isBoardCreateLabelModalOpen },
        { isOpen: isBoardCopyModalOpen },
      ]}
    >
      <div className={`py-2 ${modalHeight.contentClasses}`}>
        <button
          ref={customFieldsButtonRef}
          onClick={handleCustomFields}
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-normal text-gray-700 transition-colors hover:bg-gray-100"
        >
          <span className="text-gray-500">
            <IconCustomFields className="h-4 w-4" />
          </span>
          Custom Fields
        </button>

        <MenuItem onClick={handleLabels} icon={<IconLabel className="h-4 w-4" />}>
          Labels
        </MenuItem>

        <MenuItem onClick={handleArchivedItems} icon={<IconArchive className="h-4 w-4" />}>
          Archived items
        </MenuItem>

        <MenuItem
          onClick={handleToggleAllLists}
          icon={
            areAllListsCollapsed ? (
              <IconExpand className="h-4 w-4" />
            ) : (
              <IconCollapse className="h-4 w-4" />
            )
          }
        >
          {areAllListsCollapsed ? 'Expand all lists' : 'Collapse all lists'}
        </MenuItem>

        <MenuItem onClick={handleCopyBoard} icon={<IconCopyBoard className="h-4 w-4" />}>
          Copy board
        </MenuItem>
      </div>
    </CardModal>
  );
});

export { BoardMenuModal };
