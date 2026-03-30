import React, { memo, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { CardModal } from '../ui';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useTrelloOperations } from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';
import { getTrelloBrandName } from '@trello/_lib/utils/brand';

type CopyBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
};

const CopyBoardModal: FC<CopyBoardModalProps> = memo(function CopyBoardModal({
  isOpen,
  onClose,
  buttonRef,
}) {
  const [boardTitle, setBoardTitle] = useState('');
  const [keepCards, setKeepCards] = useState(true);
  const [keepTemplateCards, setKeepTemplateCards] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { duplicateBoard, switchBoard } = useTrelloOperations();
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const modalHeight = useDynamicModalHeight();

  // Use unified anchored positioning
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'right',
    offset: 8,
    fallbackWidth: 350,
    fallbackHeight: 450,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setBoardTitle('');
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    } else {
      setBoardTitle('');
      setKeepCards(true);
      setKeepTemplateCards(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!boardTitle.trim()) return;

    const newBoardId = duplicateBoard({
      boardId: currentBoardId,
      title: boardTitle.trim(),
      keepCards,
      keepTemplateCards,
    });

    // Switch to the new board
    switchBoard({ boardId: newBoardId });

    onClose();
  };

  const canCreate = boardTitle.trim().length > 0;

  return (
    <CardModal
      ref={modalRef}
      title="Copy board"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: position.top, left: position.left }}
      buttonRef={buttonRef}
      dataAttribute="data-copy-board-modal"
      containerClassName={`z-[70] ${modalHeight.modalContainerClasses}`}
      className={`!w-[350px] ${modalHeight.modalClasses}`}
    >
      <div className={modalHeight.contentClasses}>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 font-normal">
          {/* Board Title Section */}
          <div>
            <label className="mb-1 block text-sm font-normal text-gray-700">Title</label>
            <input
              ref={titleInputRef}
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Board title"
            />
          </div>

          {/* Workspace Section */}
          <div>
            <label className="mb-1 block text-sm font-normal text-gray-700">Workspace</label>
            <div className="relative">
              <select
                disabled
                className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
              >
                <option>{`${getTrelloBrandName()} Workspace`}</option>
              </select>
            </div>
          </div>

          {/* Copy Options */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="keep-cards"
                checked={keepCards}
                onChange={(e) => setKeepCards(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="keep-cards" className="text-sm font-normal text-gray-700">
                Keep cards
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="keep-template-cards"
                checked={keepTemplateCards}
                onChange={(e) => setKeepTemplateCards(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="keep-template-cards" className="text-sm font-normal text-gray-700">
                Keep Template cards
              </label>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500">
            Activity, comments, and members will not be copied to the new board.
          </div>
        </form>
      </div>

      {/* Create Button */}
      <div className={`p-4 pt-2 ${modalHeight.footerClasses}`}>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!canCreate}
          className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            canCreate
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
        >
          Create
        </button>
      </div>
    </CardModal>
  );
});

export { CopyBoardModal };
