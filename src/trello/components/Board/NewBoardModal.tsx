import React, { memo, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { CardModal } from '../ui';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';

type NewBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (title: string) => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  placement?: 'right' | 'bottom';
};

const NewBoardModal: FC<NewBoardModalProps> = memo(function NewBoardModal({
  isOpen,
  onClose,
  onCreateBoard,
  buttonRef,
  placement = 'right',
}) {
  const [boardTitle, setBoardTitle] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Use the new modal positioning hook
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement,
    offset: 8,
    fallbackWidth: 350,
    fallbackHeight: 300,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  // Focus input when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const focus = () => {
      if (cancelled) return false;
      const el = titleInputRef.current;
      if (el) {
        el.focus();
        el.select();
        if (document.activeElement === el) {
          return true;
        }
      }
      return false;
    };
    // Try multiple times to ensure focus after mount/positioning/animation
    const rafId = window.requestAnimationFrame(() => {
      if (!focus()) {
        // fallback attempts
        setTimeout(focus, 0);
        setTimeout(focus, 50);
        setTimeout(focus, 150);
      }
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBoardTitle('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = boardTitle.trim();
    if (!trimmedTitle) return;

    onCreateBoard(trimmedTitle);
    onClose();
  };

  const canCreate = boardTitle.trim().length > 0;

  return (
    <CardModal
      ref={modalRef}
      title="Create board"
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: position.top, left: position.left }}
      buttonRef={buttonRef}
      dataAttribute="data-new-board-modal"
      containerClassName={`z-[70] ${modalHeight.modalContainerClasses}`}
      className={`!w-[350px] ${modalHeight.modalClasses}`}
    >
      <div className={modalHeight.contentClasses}>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Board Title Section */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Board title*</label>
            <input
              ref={titleInputRef}
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Project planning"
            />
            <p className="mt-1 text-xs text-gray-500">👋 Board title is required</p>
          </div>

          {/* Visibility Section */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Visibility</label>
            <div className="relative">
              <select
                disabled
                className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
              >
                <option>Workspace</option>
              </select>
            </div>
          </div>

          {/* Create Button */}
          <div className="pt-2">
            <button
              type="submit"
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
        </form>
      </div>
    </CardModal>
  );
});

export { NewBoardModal };
