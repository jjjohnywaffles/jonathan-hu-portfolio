import { useMemo } from 'react';
import type { FilterOptions } from '../types/filter-types';
import { isInboxFilter, isBoardFilter } from '../types/filter-types';

export function useActiveFilterCount(filters: FilterOptions): number {
  return useMemo(() => {
    let count = 0;

    // Count keyword filter
    if (filters.keyword.trim()) count++;

    // Count card created filters (inbox only)
    if (isInboxFilter(filters)) {
      if (filters.cardCreated.lastWeek) count++;
      if (filters.cardCreated.lastTwoWeeks) count++;
      if (filters.cardCreated.lastMonth) count++;
    }

    // Count member filters (board only)
    if (isBoardFilter(filters)) {
      if (filters.members.noMembers) count++;
      if (filters.members.assignedToMe) count++;
      // Count each selected member as one filter
      count += filters.members.selectedMembers.length;
    }

    // Count card status filters
    if (filters.cardStatus.markedComplete) count++;
    if (filters.cardStatus.notMarkedComplete) count++;

    // Count due date filters
    if (filters.dueDate.noDates) count++;
    if (filters.dueDate.overdue) count++;
    if (filters.dueDate.nextDay) count++;
    if (filters.dueDate.nextWeek) count++;
    if (filters.dueDate.nextMonth) count++;

    // Count label filters (board only)
    if (isBoardFilter(filters)) {
      if (filters.labels.noLabels) count++;
      // Count each selected label as one filter
      count += filters.labels.selectedLabels.length;

      // Count activity filters
      if (filters.activity.lastWeek) count++;
      if (filters.activity.lastTwoWeeks) count++;
      if (filters.activity.lastFourWeeks) count++;
      if (filters.activity.withoutActivity) count++;
    }

    return count;
  }, [filters]);
}
