import React, { memo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Sidebar } from './components/Inbox/Sidebar';
import { Board } from './components/Board/Board';
import { useLists, useVisibleLists, useTrelloOperations } from '@trello/_lib/selectors';

const BoardContainer: React.FC = memo(function BoardContainer() {
  const lists = useLists(); // All board lists, sorted by order (may include archived)
  const visibleLists = useVisibleLists(); // Draggable, non-archived, non-inbox lists sorted by order
  const { reorderLists, moveCard } = useTrelloOperations();

  // Track which list is being dragged
  const [draggingListId, setDraggingListId] = React.useState<string | null>(null);

  // Use ref to track dragging state synchronously for immediate CSS updates
  const draggingListIdRef = React.useRef<string | null>(null);

  const onBeforeCapture = (before: any) => {
    if (before.draggableId && before.mode === 'FLUID') {
      // Synchronously update ref and apply class BEFORE drag preview is created
      draggingListIdRef.current = before.draggableId;
      // Force immediate state update
      setDraggingListId(before.draggableId);
    }
  };

  const onDragEnd = (result: DropResult) => {
    // Clear dragging state
    draggingListIdRef.current = null;
    setDraggingListId(null);
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index)
      return;

    // Handle list reordering
    if (type === 'LIST') {
      // Get the source and destination lists from visible lists
      const sourceList = visibleLists[source.index];
      const destList = visibleLists[destination.index];

      if (!sourceList || !destList) return;

      // Check if the dragged list is draggable
      if (sourceList.isDraggable === false) return;

      // Map to indices within the non-archived board lists, matching operations.getBoardLists
      const nonArchivedBoardLists = lists.filter((l) => !l.archived);
      const actualSourceIndex = nonArchivedBoardLists.findIndex(
        (list) => list.id === sourceList.id
      );
      const actualDestIndex = nonArchivedBoardLists.findIndex((list) => list.id === destList.id);

      if (actualSourceIndex === -1 || actualDestIndex === -1) return;

      // Use the store's reorderLists method with the actual indices
      reorderLists({
        sourceIndex: actualSourceIndex,
        destinationIndex: actualDestIndex,
      });
      return;
    }

    // Handle card movements
    if (type === 'CARD') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;

      // Parse cardId from "listId-cardId-type" format (type is "mirror" or "card")
      const prefix = `${sourceListId}-`;
      if (!draggableId.startsWith(prefix)) {
        console.error('Invalid draggableId format:', {
          draggableId,
          expectedPrefix: prefix,
        });
        return;
      }
      const remainder = draggableId.slice(prefix.length);
      // Remove the "-mirror" or "-card" suffix to get the cardId
      const cardId = remainder.endsWith('-mirror')
        ? remainder.slice(0, -7) // Remove "-mirror"
        : remainder.endsWith('-card')
          ? remainder.slice(0, -5) // Remove "-card"
          : remainder; // Fallback for backwards compatibility

      // Use moveCard for both same-list reorders and cross-list moves
      moveCard({
        cardId: cardId,
        targetListId: destListId,
        targetIndex: destination.index,
        sourceListId: sourceListId,
        sourceIndex: source.index,
      });
    }
  };

  return (
    <DragDropContext onBeforeCapture={onBeforeCapture} onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100dvh-52px)] w-full items-stretch gap-4 overflow-hidden bg-white pr-4 pb-8 pl-4">
        {/* Sidebar */}
        <Sidebar className="h-full min-h-0 w-70 max-w-102 min-w-70 overflow-hidden" />
        {/* Board */}
        <div className="flex h-full min-h-0 flex-1 items-start overflow-hidden">
          <Board draggingListId={draggingListId} />
        </div>
      </div>
    </DragDropContext>
  );
});

export { BoardContainer };
