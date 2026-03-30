import React, { memo, useState, useRef, useEffect } from 'react';
import { IconSwitchBoards } from '../icons/board/icon-switch-boards';
import { useTrelloUI } from '../TrelloUIContext';
import { SwitchBoardModal } from './SwitchBoardModal';
import { useTrelloOperations, useBoardTitle } from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';
import { isTextEditorActive } from '@trello/utils/text-editor-detection';

// Correct Zustand selectors - each value selected separately
const useCurrentBoardId = () => {
  return useTrelloStore((state) => state.currentBoardId);
};

const useTotalBoards = () => {
  const boards = useTrelloStore((state) => state.boards);
  return Object.keys(boards || {}).length;
};

const SwitchBoardButton: React.FC = memo(function SwitchBoardButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { switchBoard, createBoard } = useTrelloOperations();
  const currentBoardTitle = useBoardTitle();
  const currentBoardId = useCurrentBoardId();
  const totalBoards = useTotalBoards();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { activeCardModal } = useTrelloUI();

  // Debug current board state
  console.log('Current board ID:', currentBoardId);
  console.log('Total boards:', totalBoards);

  const handleBoardSwitch = (boardId: string) => {
    console.log('Switching to board:', boardId);
    switchBoard({ boardId });
    console.log('Board switched successfully');
    setIsModalOpen(false);
  };

  const handleCreateBoard = (title: string) => {
    console.log('Creating board with title:', title);
    const boardId = createBoard({ title });
    console.log('Board created with ID:', boardId);
    switchBoard({ boardId });
    console.log('Switched to new board');
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Global "B" shortcut to toggle the switch board modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeCardModal != null) return;
      if (e.ctrlKey || e.metaKey) return;
      if (e.key !== 'b' && e.key !== 'B') return;
      // Ignore when typing in inputs/editors
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isTextEditorActive()
      ) {
        return;
      }
      e.preventDefault();
      setIsModalOpen(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeCardModal]);

  return (
    <>
      {/* Fixed bottom button - centered (below any modal layers) */}
      <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 transform">
        <div className="rounded-md border border-gray-200 bg-white shadow-lg">
          <button
            ref={buttonRef}
            onClick={handleOpenModal}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <IconSwitchBoards className="h-4 w-4" />
            Switch boards
          </button>
        </div>
      </div>

      {/* Switch Board Modal */}
      <SwitchBoardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreateBoard={handleCreateBoard}
        onSwitchBoard={handleBoardSwitch}
        buttonRef={buttonRef}
      />
    </>
  );
});

export { SwitchBoardButton };
