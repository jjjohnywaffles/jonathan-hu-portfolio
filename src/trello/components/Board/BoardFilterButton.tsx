import React, { memo, useEffect, useRef } from 'react';
import { IconBoardFilter } from '../icons/board/icon-board-filter';
import { useBoardFilterState } from '../../hooks/use-board-filters';
import { FilterModal } from '../Inbox/InboxFilterModal';
import type { FilterOptions as InboxFilterOptions } from '../Inbox/InboxFilterModal';
import { type BoardFilterOptions, createBoardFilters } from '../../types/filter-types';
import { Tooltip } from '../Tooltip';
import { useTrelloUI } from '../TrelloUIContext';
import { useNotifications } from '../NotificationContext';
import { isTextEditorActive } from '../../utils/text-editor-detection';
import { useBoardFilters } from '@trello/_lib/selectors';
import { useTrelloStore } from '@trello/_lib';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';
import { cn } from '@trello/_lib/shims/utils';

const BoardFilterButton = memo(function BoardFilterButton() {
  const { activeCardModal } = useTrelloUI();
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');
  const {
    activeBoardFilters,
    filteredCardCount,
    hasActiveFilters,
    isBoardFilterModalOpen,
    filterButtonRef,
    handleOpenBoardFilterModal,
    handleCloseBoardFilterModal,
    handleApplyBoardFilters,
    handleClearAllFilters,
  } = useBoardFilterState();
  const { showNotification } = useNotifications();
  const currentBoardFilters = useBoardFilters();
  const currentBoardId = useTrelloStore((state) => state.currentBoardId);
  const previousBoardIdRef = useRef<string | null>(null);

  // Global 'f' shortcut to open board filter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeCardModal != null) return;
      if (e.ctrlKey || e.metaKey) return;
      if (e.key !== 'f' && e.key !== 'F') return;
      // Ignore when typing in inputs/textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      handleOpenBoardFilterModal();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleOpenBoardFilterModal, activeCardModal]);

  // Global 'q' shortcut to toggle "assigned to me" filter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeCardModal != null) return;
      if (e.ctrlKey || e.metaKey) return;
      if (e.key !== 'q' && e.key !== 'Q') return;
      // Ignore when typing in inputs/textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isTextEditorActive()
      ) {
        return;
      }
      e.preventDefault();

      // Check if "assigned to me" filter is already active
      const isAssignedToMeActive = currentBoardFilters.members?.assignedToMe === true;

      if (isAssignedToMeActive) {
        // Clear all filters (no toast)
        handleClearAllFilters();
      } else {
        // Apply "assigned to me" filter
        const newFilters: BoardFilterOptions = {
          ...createBoardFilters(),
          members: {
            noMembers: false,
            assignedToMe: true,
            selectedMembers: [],
            enableDropdown: false,
          },
        };
        handleApplyBoardFilters(newFilters);

        // Show filter applied notification
        showNotification({
          type: 'filter',
          message: 'Filters applied: only showing cards you are a member of.',
          actionLabel: 'Clear filters',
          onAction: () => {
            handleClearAllFilters();
          },
          duration: 7000,
        });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [
    activeCardModal,
    currentBoardFilters,
    handleApplyBoardFilters,
    handleClearAllFilters,
    showNotification,
  ]);

  useEffect(() => {
    if (!currentBoardId) {
      return;
    }

    if (previousBoardIdRef.current == null) {
      previousBoardIdRef.current = currentBoardId;
      return;
    }

    if (previousBoardIdRef.current !== currentBoardId && hasActiveFilters) {
      showNotification({
        type: 'filter',
        message: 'This board currently has filters applied.',
        actionLabel: 'Clear filters',
        onAction: () => {
          handleClearAllFilters();
        },
        duration: 7000,
      });
    }

    previousBoardIdRef.current = currentBoardId;
  }, [currentBoardId, hasActiveFilters, handleClearAllFilters, showNotification]);

  return (
    <>
      {hasActiveFilters ? (
        <Tooltip content="Filter cards" shortcut="F" position="bottom">
          <div
            className={cn(
              'flex items-center rounded-sm bg-gray-100 text-gray-800',
              isOnlyHotkeys && 'matrices-disabled'
            )}
          >
            <button
              ref={filterButtonRef}
              onClick={isOnlyHotkeys ? undefined : handleOpenBoardFilterModal}
              className="flex items-center gap-1.5 px-2 py-1 transition-colors hover:bg-gray-200"
            >
              <IconBoardFilter className="h-4 w-4 text-gray-800" />
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-sm font-medium">{filteredCardCount}</span>
              </div>
            </button>
            <button
              onClick={isOnlyHotkeys ? undefined : handleClearAllFilters}
              className="border-l border-gray-300 px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-200"
            >
              Clear all
            </button>
          </div>
        </Tooltip>
      ) : (
        <Tooltip content="Filter cards" shortcut="F" position="bottom">
          <button
            ref={filterButtonRef}
            onClick={isOnlyHotkeys ? undefined : handleOpenBoardFilterModal}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/10',
              isOnlyHotkeys && 'matrices-disabled'
            )}
          >
            <IconBoardFilter className="h-4 w-4 text-white" />
          </button>
        </Tooltip>
      )}

      {/* Board Filter Modal */}
      <FilterModal
        variant="board"
        isOpen={isBoardFilterModalOpen}
        onClose={handleCloseBoardFilterModal}
        onApplyFilters={(filters: InboxFilterOptions) =>
          handleApplyBoardFilters(filters as unknown as BoardFilterOptions)
        }
        buttonRef={filterButtonRef}
        initialFilters={
          {
            ...activeBoardFilters,
            variant: 'board',
            members: activeBoardFilters.members || {
              noMembers: false,
              assignedToMe: false,
              selectedMembers: [],
              enableDropdown: false,
            },
            labels: activeBoardFilters.labels || {
              noLabels: false,
              selectedLabels: [],
              enableDropdown: false,
            },
            activity: activeBoardFilters.activity || {
              lastWeek: false,
              lastTwoWeeks: false,
              lastFourWeeks: false,
              withoutActivity: false,
            },
          } as BoardFilterOptions
        }
      />
    </>
  );
});

export { BoardFilterButton };
