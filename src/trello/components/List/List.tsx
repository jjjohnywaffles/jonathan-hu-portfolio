import React, { useState, memo, useRef, useEffect, useCallback } from 'react';
import { Droppable, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { DraggableCard } from '../shared/DraggableCard';
import { Tooltip } from '../Tooltip';
import { IconCollapse } from '../icons/list/icon-collapse';
import { IconListActions } from '../icons/list/icon-list-actions';
import { IconPlus } from '../icons/list/icon-plus';
import IconWatch from '../icons/card-modal/icon-watch';
import { IconTemplateCreate } from '../icons/list/icon-template-create';
import { useTrelloUI } from '../TrelloUIContext';
import { ListAction } from './ListAction';
import { CardCreationForm } from './CardCreationForm';
import {
  useList,
  useListCards,
  useFilteredListCards,
  useFilteredListCardCount,
  useHasActiveBoardFilters,
  useTrelloOperations,
  useIsListWatched,
} from '@trello/_lib/selectors';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';
import { getCardRefIndex } from '@trello/hooks/use-card-ref-index';
import { cn } from '@trello/_lib/shims/utils';
import { isPointerWithinElement, usePointerPosition } from '@trello/hooks/use-pointer-position';

type ListProps = {
  listId: string;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
};

const List: React.FC<ListProps> = memo(function List({
  listId,
  dragHandleProps,
  isHovered: propIsHovered,
  onHoverChange,
}) {
  // Use selectors for state access
  const list = useList(listId);
  const isOnlyDragDrop = useIsModifierEnabled('onlyDragDrop');
  const isNoDragDrop = useIsModifierEnabled('noDragDrop');
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');
  const { updateListTitle, toggleListCollapse, addCard } = useTrelloOperations();
  const listCards = useFilteredListCards(listId);
  const filteredCardCount = useFilteredListCardCount(listId);
  const hasActiveFilters = useHasActiveBoardFilters();
  const { activeCardModal } = useTrelloUI();
  const isListWatched = useIsListWatched(listId);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [addingAtTop, setAddingAtTop] = useState(false);
  const [topTitle, setTopTitle] = useState('');
  const [topCardInsertPosition, setTopCardInsertPosition] = useState(0); // Position in cardRefs array
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = usePointerPosition();

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // List action modal state
  const [isListActionOpen, setIsListActionOpen] = useState(false);
  const listActionButtonRef = useRef<HTMLButtonElement>(null);

  // Refs for click-outside detection
  const bottomFormRef = useRef<HTMLDivElement>(null);
  const topFormRef = useRef<HTMLDivElement>(null);

  // Use prop hover state if provided, otherwise use local state
  const [localIsHovered, setLocalIsHovered] = useState(false);
  const isHovered = propIsHovered ?? localIsHovered;

  // Shared cancel handler - saves if has text, closes if empty
  const handleCardCreationCancel = useCallback(
    (formType: 'top' | 'bottom', currentTitle: string) => {
      if (currentTitle.trim()) {
        // Has text - save it
        if (formType === 'top') {
          addCard({
            listId,
            title: currentTitle.trim(),
            position: topCardInsertPosition,
          });
          setTopCardInsertPosition((prev) => prev + 1);
          setTopTitle('');
        } else {
          addCard({ listId, title: currentTitle.trim() });
          setTitle('');
          setAdding(false);
        }
      } else {
        // No text - just close
        if (formType === 'top') {
          setAddingAtTop(false);
          setTopTitle('');
          setTopCardInsertPosition(0);
        } else {
          setAdding(false);
          setTitle('');
        }
      }
    },
    [addCard, listId, topCardInsertPosition]
  );

  // Auto-size the list title textarea to fit wrapped lines
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const el = titleInputRef.current;
      el.focus();
      el.select();
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const el = titleInputRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditingTitle, editingTitle]);

  // Keyboard: 'n' to open add card
  const startTopCardCreation = useCallback(() => {
    setAddingAtTop(true);
    setTopTitle('');
    setTopCardInsertPosition(0);
    setIsListActionOpen(false); // Close the list action modal
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeCardModal != null) return;
      if (e.ctrlKey || e.metaKey) return;
      // Ignore when typing in inputs/textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key !== 'n' && e.key !== 'N') return;

      const listEl = listContainerRef.current;
      const pointer = pointerRef.current;
      if (!listEl || !pointer) return;
      if (!isPointerWithinElement(listEl, pointer)) return;

      e.preventDefault();

      // Find the card under pointer within this list
      const cardNodes = Array.from(listEl.querySelectorAll<HTMLElement>('.card-container'));
      const targetIdx = cardNodes.findIndex((node) => isPointerWithinElement(node, pointer));

      setIsListActionOpen(false);

      if (targetIdx >= 0) {
        // Insert after the target card
        setAddingAtTop(true);
        setTopTitle('');
        setTopCardInsertPosition(targetIdx + 1);
        return;
      }

      // Otherwise, open creator at the top of the list
      startTopCardCreation();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pointerRef, startTopCardCreation, activeCardModal]);

  // Close card creation forms when clicking outside
  useEffect(() => {
    if (!adding && !addingAtTop) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (adding && bottomFormRef.current && !bottomFormRef.current.contains(target)) {
        handleCardCreationCancel('bottom', title);
      }

      if (addingAtTop && topFormRef.current && !topFormRef.current.contains(target)) {
        handleCardCreationCancel('top', topTitle);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [adding, addingAtTop, title, topTitle, handleCardCreationCancel]);

  if (!list) return null;

  const handleTitleClick = () => {
    setEditingTitle(list.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle && trimmedTitle !== list.title) {
      updateListTitle({ listId, title: trimmedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditingTitle(list.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleCollapseToggle = () => {
    toggleListCollapse({ listId });
  };

  // Shared handlers for card creation
  const handleTopCardSubmit = (title: string) => {
    addCard({ listId, title, position: topCardInsertPosition });
    setTopTitle('');
    setTopCardInsertPosition((prev) => prev + 1);
  };

  const handleBottomCardSubmit = (title: string) => {
    addCard({ listId, title });
    setTitle('');
  };

  return (
    <>
      <Droppable droppableId={listId} type="CARD">
        {(dropProvided, dropSnapshot) => (
          <div
            className={`list-container flex max-h-[calc(100dvh-168px)] w-70 flex-shrink-0 flex-col rounded-2xl bg-gray-100 p-3 ${
              list.isDraggable === false ? 'opacity-90 ring-1 ring-gray-300' : ''
            }`}
            ref={(el) => {
              dropProvided.innerRef(el);
              listContainerRef.current = el;
            }}
            {...dropProvided.droppableProps}
            onMouseEnter={() => {
              if (onHoverChange) {
                onHoverChange(true);
              } else {
                setLocalIsHovered(true);
              }
            }}
            onMouseLeave={() => {
              if (onHoverChange) {
                onHoverChange(false);
              } else {
                setLocalIsHovered(false);
              }
            }}
          >
            {/* List Title */}
            <div
              className={`mb-3 flex items-start justify-between font-semibold text-gray-800 ${
                !isEditingTitle && dragHandleProps && list.isDraggable !== false
                  ? 'cursor-move'
                  : ''
              }`}
              {...(dragHandleProps && list.isDraggable !== false ? dragHandleProps : {})}
            >
              {isEditingTitle ? (
                <textarea
                  ref={titleInputRef}
                  className="m-0 box-border block flex-1 resize-none overflow-hidden rounded border-2 border-blue-400 bg-white px-2 py-1 text-sm leading-5 font-semibold outline-none"
                  value={editingTitle}
                  onChange={(e) => {
                    setEditingTitle(e.target.value);
                    if (titleInputRef.current) {
                      const el = titleInputRef.current;
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  rows={1}
                  style={{
                    minHeight: '32px',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <h3
                  className="m-0 box-border block min-w-0 flex-1 cursor-pointer overflow-hidden rounded border-2 border-transparent bg-transparent px-2 py-1 text-sm leading-5 break-words whitespace-normal"
                  onClick={handleTitleClick}
                  style={{ minHeight: '32px', boxSizing: 'border-box' }}
                >
                  {list.title}
                </h3>
              )}
              {/* Action icons */}
              <div className="flex items-center gap-1">
                {isListWatched && (
                  <div className="flex h-7 w-7 cursor-default items-center justify-center rounded text-gray-600">
                    <IconWatch className="h-4 w-4" />
                  </div>
                )}
                <Tooltip content="Collapse list" shortcut="\" position="bottom">
                  <button
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700',
                      isOnlyHotkeys && 'matrices-disabled'
                    )}
                    onClick={isOnlyHotkeys ? undefined : handleCollapseToggle}
                    aria-label="Collapse list"
                  >
                    <IconCollapse className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Actions" position="bottom-center" variant="dark">
                  <button
                    ref={listActionButtonRef}
                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 ${isOnlyDragDrop ? 'matrices-disabled' : ''}`}
                    onClick={isOnlyDragDrop ? undefined : () => setIsListActionOpen(true)}
                  >
                    <IconListActions className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Filter Count Display */}
            {hasActiveFilters && (
              <div className="px-3 pb-2">
                <div className="text-xs text-gray-600">
                  {filteredCardCount === 0
                    ? '0 cards match filters'
                    : `${filteredCardCount} card${filteredCardCount === 1 ? '' : 's'} match${filteredCardCount === 1 ? 'es' : ''} filters`}
                </div>
              </div>
            )}

            {/* Cards with inline creation form */}
            <div className="mb-0 flex-1 overflow-y-auto">
              {listCards.map((card) => {
                const actualIndex = getCardRefIndex(card.id, list?.cardRefs, card.isMirror);
                if (actualIndex === -1) return null;

                return (
                  <React.Fragment
                    key={`${listId}-${card.id}-${card.isMirror ? 'mirror' : 'card'}-${actualIndex}-wrapper`}
                  >
                    {/* Show creation form at the current insertion position */}
                    {addingAtTop && actualIndex === topCardInsertPosition && (
                      <div ref={topFormRef} className="mt-2 mb-1.5">
                        <CardCreationForm
                          value={topTitle}
                          onChange={setTopTitle}
                          onSubmit={handleTopCardSubmit}
                          onCancel={() => handleCardCreationCancel('top', topTitle)}
                        />
                      </div>
                    )}
                    <DraggableCard
                      card={card}
                      listId={listId}
                      actualIndex={actualIndex}
                      isDisabled={activeCardModal != null || isNoDragDrop}
                    />
                  </React.Fragment>
                );
              })}

              {/* Show creation form after all cards if position exceeds card count */}
              {addingAtTop && topCardInsertPosition >= (list?.cardRefs.length ?? 0) && (
                <div ref={topFormRef} className="mt-2 mb-1.5">
                  <CardCreationForm
                    value={topTitle}
                    onChange={setTopTitle}
                    onSubmit={handleTopCardSubmit}
                    onCancel={() => handleCardCreationCancel('top', topTitle)}
                  />
                </div>
              )}

              {/* Show creation form at bottom if adding and not at top */}
              {adding && !addingAtTop && (
                <div ref={bottomFormRef} className="mt-2 mb-1.5">
                  <CardCreationForm
                    value={title}
                    onChange={setTitle}
                    onSubmit={handleBottomCardSubmit}
                    onCancel={() => handleCardCreationCancel('bottom', title)}
                  />
                </div>
              )}

              {/* Only show the built-in placeholder for drop location */}
              {dropProvided.placeholder}
            </div>
            {/* Add a card button row - hide when any creation form is open */}
            {!(adding || addingAtTop) ? (
              <div className="group flex h-8 w-full items-center">
                <button
                  className="flex h-8 w-full flex-1 cursor-pointer items-center gap-2 py-0 pr-2 pl-1 text-left text-sm text-gray-600 transition-all group-hover:rounded hover:rounded hover:bg-gray-200"
                  onClick={() => setAdding(true)}
                >
                  <IconPlus className="h-4 w-4" />
                  <span className="flex items-center">Add a card</span>
                </button>
                {/* Template create icon (temporarily disabled placeholder) */}
                {/*
                <Tooltip content="Create from template..." position="bottom">
                  <button className="ml-2 flex h-8 w-8 cursor-pointer items-center justify-center text-gray-500 transition-all hover:rounded hover:bg-gray-200 hover:text-gray-700">
                    <IconTemplateCreate className="h-4 w-4" />
                  </button>
                </Tooltip>
                */}
                <button className="matrices-disabled ml-2 flex h-8 w-8 cursor-pointer items-center justify-center text-gray-500 transition-all hover:rounded hover:bg-gray-200 hover:text-gray-700">
                  <IconTemplateCreate className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        )}
      </Droppable>

      {/* List Action Modal */}
      <ListAction
        listId={listId}
        isOpen={isListActionOpen}
        onClose={() => setIsListActionOpen(false)}
        actionButtonRef={listActionButtonRef}
        onStartTopCardCreation={startTopCardCreation}
      />
    </>
  );
});

export { List };
