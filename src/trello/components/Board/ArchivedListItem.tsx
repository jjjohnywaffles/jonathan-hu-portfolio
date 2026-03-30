import React, { memo, useState, useRef } from 'react';
import type { FC } from 'react';
import { IconRestore } from '../icons/card-modal-action/icon-restore';
import { IconTrash } from '../icons/card-modal/icon-trash';
import { ConfirmDeleteCardModal } from '../CardModal/ConfirmDeleteCardModal';
import type { List } from '@trello/_lib/types';

type ArchivedListItemProps = {
  list: List;
  onRestore: (listId: string) => void;
  onDelete?: (listId: string) => void;
};

const ArchivedListItem: FC<ArchivedListItemProps> = memo(function ArchivedListItem({
  list,
  onRestore,
  onDelete,
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const handleRestore = () => {
    onRestore(list.id);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(list.id);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <ConfirmDeleteCardModal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        onConfirmDelete={handleConfirmDelete}
        buttonRef={deleteButtonRef as React.RefObject<HTMLButtonElement>}
        placement="bottom-start"
        offset={0}
        viewportPadding={0}
        lockOnOpen={true}
        reflowOnScroll={true}
        reflowOnResize={true}
        titleText="Delete list?"
        bodyText="All cards, actions, and activity in this list will be permanently deleted, and you won't be able to re-open this list. There is no undo."
        confirmButtonText="Delete"
      />

      {/* List item */}
      <div className="group border-b border-gray-200 py-3 last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="block text-sm break-words whitespace-normal text-gray-900">
              {list.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestore}
              className="flex items-center gap-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
              title="Send to board"
            >
              <IconRestore className="h-4 w-4" />
              Restore
            </button>

            {onDelete && (
              <button
                ref={deleteButtonRef}
                onClick={handleDeleteClick}
                className="flex items-center justify-center rounded bg-gray-100 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-gray-200 hover:text-red-700"
                title="Delete"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export { ArchivedListItem };
