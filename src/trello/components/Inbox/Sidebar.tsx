import React, { useState, memo, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { DraggableCard } from '../shared/DraggableCard';
import { IconInbox } from '../icons/sidebar/icon-inbox';
import { IconFilter } from '../icons/header/icon-filter';
import { IconListActions } from '../icons/list/icon-list-actions';
import { FlexContainer, Input, Button, Text, IconButton } from '../ui';
import { useTrelloUI } from '../TrelloUIContext';
import { useActiveFilterCount } from '../../hooks/use-active-filter-count';
import type { InboxFilterOptions } from '../../types/filter-types';
import { createInboxFilters } from '../../types/filter-types';
import { InboxMenuModal } from './InboxMenuModal';
import { InboxFilterModal } from './InboxFilterModal';
import { useFilteredInboxCards, useTrelloOperations } from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';
import { getCardRefIndex } from '@trello/hooks/use-card-ref-index';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';

type SidebarProps = {
  className?: string;
};

const Sidebar: React.FC<SidebarProps> = memo(function Sidebar({ className = '' }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isInboxMenuModalOpen, setIsInboxMenuModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<InboxFilterOptions>(createInboxFilters());
  const { addCard } = useTrelloOperations();
  const { activeCardModal } = useTrelloUI();
  const isNoDragDrop = useIsModifierEnabled('noDragDrop');
  const inboxListId = 'inbox';
  const [isFocused, setIsFocused] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const inboxMenuButtonRef = useRef<HTMLButtonElement>(null);
  const addCardFormRef = useRef<HTMLDivElement>(null);
  const addCardInputRef = useRef<HTMLTextAreaElement>(null);

  const handleOpenFilterModal = () => {
    setIsFilterModalOpen((open) => !open);
  };

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleOpenInboxMenuModal = () => {
    setIsInboxMenuModalOpen((open) => !open);
  };

  const handleCloseInboxMenuModal = () => {
    setIsInboxMenuModalOpen(false);
  };

  // Use the new selector for filtered inbox cards
  const inboxCards = useFilteredInboxCards(activeFilters);

  // Get the inbox list to access cardRefs for proper drag indices
  const inboxList = useTrelloStore((state) => state.lists['inbox']);

  const handleApplyFilters = (filters: any) => {
    // Convert the modal's FilterOptions to InboxFilterOptions
    const inboxFilters: InboxFilterOptions = {
      variant: 'inbox',
      keyword: filters.keyword,
      cardStatus: filters.cardStatus,
      dueDate: filters.dueDate,
      cardCreated: filters.cardCreated || {
        lastWeek: false,
        lastTwoWeeks: false,
        lastMonth: false,
      },
    };
    setActiveFilters(inboxFilters);
  };

  const activeFilterCount = useActiveFilterCount(activeFilters);

  // Close card creation form when clicking outside (but not on cards for drag-and-drop)
  useEffect(() => {
    if (!adding) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking inside the form
      if (addCardFormRef.current && addCardFormRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on a card (for drag-and-drop)
      const isClickOnCard =
        target.closest('[data-rfd-draggable-id]') ||
        target.closest('[data-rfd-drag-handle-draggable-id]');
      if (isClickOnCard) {
        return;
      }

      // Close the form - save if has text
      if (title.trim()) {
        addCard({ listId: inboxListId, title: title.trim(), position: 0 });
      }
      setAdding(false);
      setTitle('');
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [adding, title, addCard, inboxListId]);

  return (
    <aside className={`flex min-h-0 flex-col ${className}`}>
      {/* Inbox Bubble */}
      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-start rounded-2xl border border-gray-300 bg-[#deebfe] shadow">
        {/* Top section with blue background */}
        <div className="flex h-14 w-full items-center justify-between rounded-t-2xl bg-[#eaf2fe] px-6">
          <div className="flex items-center">
            <IconInbox className="mr-1.5 h-4 w-4 text-gray-600" />
            <Text variant="body" className="text-base font-bold text-gray-700">
              Inbox
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <button
              ref={filterButtonRef}
              onClick={handleOpenFilterModal}
              className={`flex h-8 w-8 items-center justify-center rounded-sm transition-colors duration-200 ${
                activeFilterCount > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IconFilter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="text-sm font-medium underline">{activeFilterCount}</span>
              )}
            </button>
            <button
              ref={inboxMenuButtonRef}
              onClick={handleOpenInboxMenuModal}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-600 transition-colors duration-200 hover:bg-gray-200"
            >
              <IconListActions className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Divider */}
        <div className="h-px w-full bg-gray-200" />
        {/* Add card and cards - align with board lists */}
        <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Droppable droppableId={inboxListId} type="CARD">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pt-4 pb-0"
                style={{
                  minHeight: 120,
                  pointerEvents: 'auto',
                }}
              >
                {/* Add card button/input and cards with separate gaps */}
                <div className="flex flex-col gap-2">
                  {adding ? (
                    <div
                      ref={addCardFormRef}
                      className={`flex min-h-24 w-full flex-col justify-between rounded-lg border bg-white p-2 shadow border-gray-600${isFocused ? 'border-t-2 border-t-blue-600' : ''}`}
                    >
                      <Input
                        ref={addCardInputRef}
                        variant="textarea"
                        className="min-h-[38px] resize-y border-blue-300 focus:ring-2 focus:ring-blue-400"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (title.trim()) {
                              addCard({
                                listId: inboxListId,
                                title: title.trim(),
                                position: 0, // Add at top since form is at top
                              });
                              setTitle('');
                              // Keep form open for continuous card creation
                            } else {
                              // Empty field - close the form
                              setAdding(false);
                              setTitle('');
                            }
                          }
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoFocus
                        placeholder="Enter a title"
                      />
                      <FlexContainer gap="2" className="mt-2">
                        <Button
                          className="bg-[#0c66e4] font-semibold hover:bg-[#0055cc]"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (title.trim()) {
                              addCard({
                                listId: inboxListId,
                                title: title.trim(),
                                position: 0, // Add at top since form is at top
                              });
                              setTitle('');
                              // Keep form open for continuous card creation
                              // Refocus input after adding card
                              setTimeout(() => {
                                addCardInputRef.current?.focus();
                              }, 0);
                            } else {
                              // No text - close the form
                              setAdding(false);
                              setTitle('');
                            }
                          }}
                        >
                          Add a card
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-base font-semibold text-gray-700"
                          onClick={() => {
                            setAdding(false);
                            setTitle('');
                          }}
                          aria-label="Cancel"
                        >
                          Cancel
                        </Button>
                      </FlexContainer>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="h-9 w-full cursor-pointer justify-start border-gray-200 bg-white p-3 text-left text-sm text-gray-600 shadow hover:bg-gray-50"
                      onClick={() => setAdding(true)}
                    >
                      Add a card
                    </Button>
                  )}
                  <div className="flex flex-col gap-1">
                    {inboxCards.map((card) => {
                      if (!card) return null;
                      const actualIndex = getCardRefIndex(
                        card.id,
                        inboxList?.cardRefs,
                        card.isMirror
                      );
                      if (actualIndex === -1) return null;

                      return (
                        <DraggableCard
                          key={`inbox-${card.id}-${card.isMirror ? 'mirror' : 'card'}-${actualIndex}`}
                          card={card}
                          listId={inboxListId}
                          actualIndex={actualIndex}
                          isDisabled={activeCardModal != null || isNoDragDrop}
                        />
                      );
                    })}
                    {dropProvided.placeholder}
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </div>

      {/* Filter Modal */}
      <InboxFilterModal
        isOpen={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
        buttonRef={filterButtonRef}
        initialFilters={activeFilters}
      />

      {/* Inbox Menu Modal */}
      <InboxMenuModal
        isOpen={isInboxMenuModalOpen}
        onClose={handleCloseInboxMenuModal}
        buttonRef={inboxMenuButtonRef}
      />
    </aside>
  );
});

export { Sidebar };
