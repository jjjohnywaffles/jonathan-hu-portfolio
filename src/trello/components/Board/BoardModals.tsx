import React, { memo, useRef, useState } from 'react';
import type { FC } from 'react';
import { CustomFieldModal } from '../CardModal/CustomField/CustomFieldModal';
import { LabelsModal } from '../CardModal/LabelsModal';
import { CreateLabelModal } from '../CardModal/CreateLabelModal';
import { useTrelloUI } from '../TrelloUIContext';
import { ArchivedCardsBoardModal } from './ArchivedCardsBoardModal';
import { CopyBoardModal } from './CopyBoardModal';
import { BoardMenuModal } from './BoardMenuModal';
import { useLabels } from '@trello/_lib/selectors';

type BoardModalsProps = {
  boardMenuButtonRef: React.RefObject<HTMLButtonElement | null>;
};

const BoardModals: FC<BoardModalsProps> = memo(function BoardModals({ boardMenuButtonRef }) {
  const allLabels = useLabels();
  const [isBoardMenuModalOpen, setIsBoardMenuModalOpen] = useState(false);

  const {
    isBoardCustomFieldsModalOpen,
    closeBoardCustomFieldsModal,
    boardCustomFieldsButtonRef,
    isBoardLabelsModalOpen,
    closeBoardLabelsModal,
    boardLabelsModalRef,
    isBoardCreateLabelModalOpen,
    boardEditingLabelId,
    openBoardCreateLabelModal,
    closeBoardCreateLabelModal,
    openBoardEditLabel,
    boardCreateLabelButtonRef,
    boardCreateLabelModalRef,
    isBoardArchivedCardsModalOpen,
    closeBoardArchivedCardsModal,
    isBoardCopyModalOpen,
    closeBoardCopyModal,
  } = useTrelloUI();

  // Look up the current editing label data
  const editingLabel = boardEditingLabelId
    ? allLabels.find((label) => label.id === boardEditingLabelId)
    : null;

  // Board menu modal handlers
  const handleOpenBoardMenuModal = () => {
    setIsBoardMenuModalOpen((open) => !open);
  };

  const handleCloseBoardMenuModal = () => {
    setIsBoardMenuModalOpen(false);
  };

  // Board custom fields modal handlers
  // No-op: inline editing handled inside CustomFieldModal
  const handleOpenActiveFieldEditor = () => {};

  // Board labels modal handlers
  const handleCloseBoardLabelsModal = () => {
    closeBoardLabelsModal();
  };

  const handleOpenBoardCreateLabel = (buttonRef?: React.RefObject<HTMLButtonElement | null>) => {
    openBoardCreateLabelModal(buttonRef);
  };

  const handleCloseBoardCreateLabel = () => {
    closeBoardCreateLabelModal();
  };

  const handleOpenBoardEditLabel = (labelId: string, buttonElement?: HTMLButtonElement) => {
    openBoardEditLabel(labelId);
  };

  // Board archived cards modal handlers
  const handleCloseBoardArchivedCardsModal = () => {
    closeBoardArchivedCardsModal();
  };

  return (
    <>
      {/* Board Menu Modal */}
      <BoardMenuModal
        isOpen={isBoardMenuModalOpen}
        onClose={handleCloseBoardMenuModal}
        buttonRef={boardMenuButtonRef}
      />

      {/* Board Custom Fields Modal */}
      <CustomFieldModal
        isOpen={isBoardCustomFieldsModalOpen}
        onClose={closeBoardCustomFieldsModal}
        buttonRef={boardCustomFieldsButtonRef}
      />

      {/* Board Active Field Editor Modal removed: inline editor used inside CustomFieldModal */}

      {/* Board Labels Modal */}
      <LabelsModal
        variant="board"
        isOpen={isBoardLabelsModalOpen}
        onClose={handleCloseBoardLabelsModal}
        onOpenCreateLabel={handleOpenBoardCreateLabel}
        onOpenEditLabel={handleOpenBoardEditLabel}
        buttonRef={boardMenuButtonRef}
        modalRef={boardLabelsModalRef}
        isCreateLabelModalOpen={isBoardCreateLabelModalOpen}
      />

      {/* Board Create Label Modal */}
      <CreateLabelModal
        variant="board"
        isOpen={isBoardCreateLabelModalOpen}
        onClose={handleCloseBoardCreateLabel}
        editLabelId={boardEditingLabelId}
        initialTitle={editingLabel?.title || ''}
        initialColor={editingLabel?.color || 'lime'}
        buttonRef={boardCreateLabelButtonRef}
        modalRef={boardCreateLabelModalRef}
        labelsModalRef={boardLabelsModalRef}
      />

      {/* Board Archived Cards Modal */}
      <ArchivedCardsBoardModal
        isOpen={isBoardArchivedCardsModalOpen}
        onClose={handleCloseBoardArchivedCardsModal}
        buttonRef={boardMenuButtonRef}
        onBackToBoardMenu={handleOpenBoardMenuModal}
      />

      {/* Board Copy Modal */}
      <CopyBoardModal
        isOpen={isBoardCopyModalOpen}
        onClose={closeBoardCopyModal}
        buttonRef={boardMenuButtonRef}
      />
    </>
  );
});

export { BoardModals };
