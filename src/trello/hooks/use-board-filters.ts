import { useState, useCallback, useRef } from 'react';
import type { FilterOptions } from '../types/filter-types';
import { isBoardFilter } from '../types/filter-types';
import {
  useBoardFilters,
  useFilteredCardCount,
  useHasActiveBoardFilters,
  useTrelloOperations,
} from '@trello/_lib/selectors';
import type { BoardFilterOptions as StoreBoardFilterOptions } from '@trello/_lib/types';

export function useBoardFilterState() {
  const activeBoardFilters = useBoardFilters();
  const filteredCardCount = useFilteredCardCount();
  const hasActiveFilters = useHasActiveBoardFilters();
  const { updateBoardFilters, clearBoardFilters } = useTrelloOperations();

  const [isBoardFilterModalOpen, setIsBoardFilterModalOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const handleOpenBoardFilterModal = useCallback(() => {
    setIsBoardFilterModalOpen(true);
  }, []);

  const handleCloseBoardFilterModal = useCallback(() => {
    setIsBoardFilterModalOpen(false);
  }, []);

  const handleApplyBoardFilters = useCallback(
    (filters: FilterOptions) => {
      // Extract board filter fields only (exclude variant)
      if (isBoardFilter(filters)) {
        const boardFilters: StoreBoardFilterOptions = {
          keyword: filters.keyword,
          members: filters.members,
          cardStatus: filters.cardStatus,
          dueDate: filters.dueDate,
          labels: filters.labels,
          activity: filters.activity,
          filterSnapshotCardIds: [],
        };
        updateBoardFilters({ filters: boardFilters });
      }
    },
    [updateBoardFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    clearBoardFilters();
    setIsBoardFilterModalOpen(false);
  }, [clearBoardFilters]);

  return {
    activeBoardFilters,
    filteredCardCount,
    hasActiveFilters,
    isBoardFilterModalOpen,
    filterButtonRef,
    handleOpenBoardFilterModal,
    handleCloseBoardFilterModal,
    handleApplyBoardFilters,
    handleClearAllFilters,
  };
}
