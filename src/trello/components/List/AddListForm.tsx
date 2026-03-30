import React, { memo } from 'react';
import type { FC } from 'react';
import { FlexContainer, Input, Button } from '../ui';
import { useTrelloUI } from '../TrelloUIContext';

const AddListForm: FC = memo(function AddListForm() {
  const {
    isAddingList,
    newListTitle,
    startAddingList,
    updateNewListTitle,
    cancelAddingList,
    saveNewList,
    addListFormRef,
    addListInputRef,
  } = useTrelloUI();

  const handleAddList = () => {
    if (newListTitle.trim()) {
      saveNewList();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddList();
    } else if (e.key === 'Escape') {
      cancelAddingList();
    }
  };

  return (
    <div ref={addListFormRef} className="mt-0 h-24 w-70 flex-shrink-0 rounded-2xl">
      {isAddingList ? (
        <div className="flex h-full w-full flex-col justify-center rounded-2xl border border-gray-300 bg-white p-4 shadow">
          <Input
            ref={addListInputRef}
            className="mb-1 border-blue-300 focus:ring-2 focus:ring-blue-400"
            value={newListTitle}
            onChange={(e) => updateNewListTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Enter list name..."
          />
          <FlexContainer gap="3" className="mt-0">
            <Button
              className="h-8 bg-[#1677ff] px-4 text-left font-semibold shadow hover:opacity-90"
              variant="default"
              onClick={handleAddList}
              disabled={!newListTitle.trim()}
            >
              Add list
            </Button>
            <Button
              variant="ghost"
              className="px-3 py-1 text-2xl font-bold text-gray-700"
              onClick={cancelAddingList}
              aria-label="Cancel"
              style={{ lineHeight: 1 }}
            >
              ×
            </Button>
          </FlexContainer>
        </div>
      ) : (
        <Button
          variant="default"
          className="h-12 w-full cursor-pointer justify-start rounded-2xl bg-[#50a3d3] px-3 text-left font-semibold shadow hover:opacity-90"
          onClick={startAddingList}
        >
          + Add another list
        </Button>
      )}
    </div>
  );
});

export { AddListForm };
