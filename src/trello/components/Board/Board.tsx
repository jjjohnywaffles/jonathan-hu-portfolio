import React, { memo } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

import { useBoardDragScroll } from '../../hooks/use-board-drag-scroll';
import { useBoardKeyboardShortcuts } from '../../hooks/use-board-keyboard-shortcuts';
import { List } from '../List/List';
import { CollapsedList } from '../List/CollapsedList';

import { AddListForm } from '../List/AddListForm';
import { useTrelloUI } from '../TrelloUIContext';
import { BoardHeader } from './BoardHeader';
import { useCollapsedListIds, useVisibleLists } from '@trello/_lib/selectors';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';

// Custom styles scoped to Trello board (scrollbars + disabled buttons)
const scrollbarStyles = `
  .trello-scrollbar::-webkit-scrollbar {
    height: 6px;
  }
  .trello-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    margin: 0 12px;
  }
  .trello-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    min-width: 30px;
  }
  .trello-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
  .trello-scrollbar {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* Matrices disabled button styling */
  .matrices-disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }

  /* List drop placeholder styles */
  .list-drop-preview {
    background-color: rgba(0, 0, 0, 0.05);
    border: 2px dashed rgba(0, 0, 0, 0.15);
    border-radius: 1rem;
    margin-right: 0.5rem;
  }
  
  /* Placeholder element that appears when dragging lists - default to expanded size */
  [data-rfd-droppable-id="board"] > div[data-rfd-placeholder-context-id] {
    background-color: transparent !important;
    border: none !important;
    border-radius: 1rem !important;
    box-shadow: none !important;
    margin: 0 !important;
    transition: none !important;
    width: calc(280px + 0.75rem) !important; /* Match expanded list width (w-70) + margin */
    min-height: 100px !important;
    flex-shrink: 0 !important;
  }
  
  /* When dragging a collapsed list, use collapsed width */
  .dragging-collapsed-list [data-rfd-droppable-id="board"] > div[data-rfd-placeholder-context-id] {
    width: calc(44px + 0.75rem) !important; /* Match collapsed list width (w-11) + margin */
  }
  
  /* Style the drag preview clone */
  .react-beautiful-dnd-drag-clone {
    opacity: 0.8;
  }
`;

type BoardProps = {
  draggingListId: string | null;
};

const Board: React.FC<BoardProps> = memo(function Board({ draggingListId }) {
  // Use selectors for state access
  const lists = useVisibleLists();
  const collapsedListIds = useCollapsedListIds();
  const { hoveredListId, setHoveredListId } = useTrelloUI();
  const isNoDragDrop = useIsModifierEnabled('noDragDrop');

  // Check if the dragging list is collapsed
  const isDraggingCollapsed = draggingListId !== null && collapsedListIds.includes(draggingListId);

  // Use custom hooks for extracted functionality
  const { dragScrollHandlers } = useBoardDragScroll();
  useBoardKeyboardShortcuts();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div
        className={`flex h-full max-h-full flex-1 flex-col overflow-hidden rounded-2xl border border-gray-300 shadow ${
          isDraggingCollapsed ? 'dragging-collapsed-list' : ''
        }`}
      >
        {/* Board Header */}
        <BoardHeader />

        {/* Lists area with drag-and-drop */}
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided, snapshot) => (
            <div
              className={`trello-scrollbar flex min-w-0 flex-1 flex-row items-start rounded-b-2xl bg-[#0079bf] pt-4 pr-6 pb-4 pl-3 ${
                snapshot.isDraggingOver ? 'list-dragging-over' : ''
              }`}
              ref={provided.innerRef}
              {...provided.droppableProps}
              {...dragScrollHandlers}
              style={{
                width: '100%',
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: '#ffffff40 #ffffff20',
              }}
            >
              {/* Render all visible lists (inbox already filtered) */}
              {lists.map((list, idx) => (
                <Draggable
                  key={list.id}
                  draggableId={list.id}
                  index={idx}
                  isDragDisabled={isNoDragDrop || list.isDraggable === false}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging && !snapshot.isDropAnimating ? 0.7 : 1,
                        transform:
                          snapshot.isDragging && !snapshot.isDropAnimating
                            ? `${provided.draggableProps.style?.transform} rotate(5deg)`
                            : provided.draggableProps.style?.transform,
                        marginRight: '0.75rem',
                      }}
                      className={`${
                        snapshot.isDragging ? 'z-50 shadow-2xl' : ''
                      } ${list.isDraggable === false ? 'cursor-default' : ''}`}
                    >
                      {collapsedListIds.includes(list.id) ? (
                        <CollapsedList
                          listId={list.id}
                          dragHandleProps={provided.dragHandleProps}
                          isHovered={hoveredListId === list.id}
                          onHoverChange={(hovered: boolean) =>
                            setHoveredListId(hovered ? list.id : null)
                          }
                        />
                      ) : (
                        <List
                          listId={list.id}
                          dragHandleProps={provided.dragHandleProps}
                          isHovered={hoveredListId === list.id}
                          onHoverChange={(hovered: boolean) =>
                            setHoveredListId(hovered ? list.id : null)
                          }
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}

              {/* Placeholder for list drops */}
              {provided.placeholder}

              {/* Add another list form */}
              <AddListForm />
            </div>
          )}
        </Droppable>
      </div>
    </>
  );
});

export { Board };
