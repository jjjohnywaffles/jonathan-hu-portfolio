import { DateTime } from 'luxon';
import type { BoardFilterOptions, Card, TrelloUser } from '@trello/_lib/types';
import { mockNow } from '@trello/_lib/shims/time';

function hasActiveMembersFilter(members: BoardFilterOptions['members'] | undefined): boolean {
  if (!members) {
    return false;
  }

  return members.noMembers || members.assignedToMe || members.selectedMembers.length > 0;
}

function hasActiveLabelFilter(labels: BoardFilterOptions['labels'] | undefined): boolean {
  if (!labels) {
    return false;
  }

  return labels.noLabels || labels.selectedLabels.length > 0;
}

function hasActiveActivityFilter(activity: BoardFilterOptions['activity'] | undefined): boolean {
  if (!activity) {
    return false;
  }

  return (
    activity.lastWeek || activity.lastTwoWeeks || activity.lastFourWeeks || activity.withoutActivity
  );
}

export function hasActiveBoardFilters(filters: BoardFilterOptions): boolean {
  // Note: filterSnapshotCardIds is not considered an active filter
  // It's just metadata about when filters were applied

  if (filters.keyword.trim()) {
    return true;
  }

  if (hasActiveMembersFilter(filters.members)) {
    return true;
  }

  if (filters.cardStatus.markedComplete || filters.cardStatus.notMarkedComplete) {
    return true;
  }

  if (
    filters.dueDate.noDates ||
    filters.dueDate.overdue ||
    filters.dueDate.nextDay ||
    filters.dueDate.nextWeek ||
    filters.dueDate.nextMonth
  ) {
    return true;
  }

  if (hasActiveLabelFilter(filters.labels)) {
    return true;
  }

  if (hasActiveActivityFilter(filters.activity)) {
    return true;
  }

  return false;
}

type CardMatchesBoardFiltersParams = {
  card: Card;
  filters: BoardFilterOptions;
  currentUser: TrelloUser;
};

export function cardMatchesBoardFilters({
  card,
  filters,
  currentUser,
}: CardMatchesBoardFiltersParams): boolean {
  // If there's a filter snapshot and this card is not in it,
  // then it was created after filters were applied - always show it
  if (
    filters.filterSnapshotCardIds.length > 0 &&
    !filters.filterSnapshotCardIds.includes(card.id)
  ) {
    return true;
  }
  if (filters.keyword.trim()) {
    const keyword = filters.keyword.toLowerCase();
    if (!card.title.toLowerCase().includes(keyword)) {
      return false;
    }
  }

  const memberFilters = filters.members;
  if (memberFilters) {
    const cardMembers = card.assignedTo ?? [];
    if (memberFilters.noMembers && cardMembers.length > 0) {
      return false;
    }
    if (memberFilters.assignedToMe && !cardMembers.includes(currentUser.id)) {
      return false;
    }
    if (memberFilters.selectedMembers.length > 0) {
      const hasSelectedMember = memberFilters.selectedMembers.some((id) =>
        cardMembers.includes(id)
      );
      if (!hasSelectedMember) {
        return false;
      }
    }
  }

  if (filters.cardStatus.markedComplete && !card.completed) {
    return false;
  }
  if (filters.cardStatus.notMarkedComplete && card.completed) {
    return false;
  }

  const now = mockNow();
  const cardDueDate = card.dueDate ? DateTime.fromISO(card.dueDate) : null;

  const dueDateFiltersActive =
    filters.dueDate.noDates ||
    filters.dueDate.overdue ||
    filters.dueDate.nextDay ||
    filters.dueDate.nextWeek ||
    filters.dueDate.nextMonth;

  if (dueDateFiltersActive) {
    let matchesDueDate = false;

    if (filters.dueDate.noDates && !cardDueDate) {
      matchesDueDate = true;
    }
    if (filters.dueDate.overdue && cardDueDate) {
      // Match the visual display logic: cards are overdue if at current time or in the past
      // Visual shows red for cards within 1-minute buffer, but filter should only show
      // cards that are actually due or overdue (not future cards)
      const diffInMinutes = cardDueDate.diff(now, 'minutes').minutes;
      if (diffInMinutes <= 0) {
        matchesDueDate = true;
      }
    }
    if (
      filters.dueDate.nextDay &&
      cardDueDate &&
      cardDueDate >= now &&
      cardDueDate < now.plus({ days: 1, minutes: 2 })
    ) {
      matchesDueDate = true;
    }
    if (
      filters.dueDate.nextWeek &&
      cardDueDate &&
      cardDueDate >= now &&
      cardDueDate <= now.plus({ weeks: 1 })
    ) {
      matchesDueDate = true;
    }
    if (
      filters.dueDate.nextMonth &&
      cardDueDate &&
      cardDueDate >= now &&
      cardDueDate <= now.plus({ months: 1 })
    ) {
      matchesDueDate = true;
    }

    if (!matchesDueDate) {
      return false;
    }
  }

  const labelFilters = filters.labels;
  if (labelFilters) {
    const cardLabels = card.labelIds ?? [];
    const hasNoLabels = labelFilters.noLabels;
    const hasSelectedLabels = labelFilters.selectedLabels.length > 0;

    if (hasNoLabels && hasSelectedLabels) {
      const hasNoLabelsMatch = cardLabels.length === 0;
      const hasSelectedLabel = labelFilters.selectedLabels.some((labelId) =>
        cardLabels.includes(labelId)
      );
      if (!hasNoLabelsMatch && !hasSelectedLabel) {
        return false;
      }
    } else {
      if (hasNoLabels && cardLabels.length > 0) {
        return false;
      }
      if (hasSelectedLabels) {
        const hasSelectedLabel = labelFilters.selectedLabels.some((labelId) =>
          cardLabels.includes(labelId)
        );
        if (!hasSelectedLabel) {
          return false;
        }
      }
    }
  }

  const activityFilters = filters.activity;
  if (activityFilters) {
    const updatedTimestamp = card.updatedAt ?? card.createdAt;
    if (updatedTimestamp == null) {
      return false;
    }

    const cardUpdated = DateTime.fromISO(updatedTimestamp);
    const oneWeekAgo = now.minus({ weeks: 1 });
    const twoWeeksAgo = now.minus({ weeks: 2 });
    const fourWeeksAgo = now.minus({ weeks: 4 });

    if (activityFilters.lastWeek && cardUpdated < oneWeekAgo) {
      return false;
    }
    if (activityFilters.lastTwoWeeks && cardUpdated < twoWeeksAgo) {
      return false;
    }
    if (activityFilters.lastFourWeeks && cardUpdated < fourWeeksAgo) {
      return false;
    }
    if (activityFilters.withoutActivity && cardUpdated > fourWeeksAgo) {
      return false;
    }
  }

  return true;
}

export function createDefaultBoardFilters(): BoardFilterOptions {
  return {
    keyword: '',
    members: {
      noMembers: false,
      assignedToMe: false,
      selectedMembers: [],
      enableDropdown: false,
    },
    cardStatus: {
      markedComplete: false,
      notMarkedComplete: false,
    },
    dueDate: {
      noDates: false,
      overdue: false,
      nextDay: false,
      nextWeek: false,
      nextMonth: false,
    },
    labels: {
      noLabels: false,
      selectedLabels: [],
      enableDropdown: false,
    },
    activity: {
      lastWeek: false,
      lastTwoWeeks: false,
      lastFourWeeks: false,
      withoutActivity: false,
    },
    filterSnapshotCardIds: [],
  };
}

export function cloneBoardFilters(filters: BoardFilterOptions): BoardFilterOptions {
  const defaults = createDefaultBoardFilters();
  const defaultMembers = defaults.members ?? {
    noMembers: false,
    assignedToMe: false,
    selectedMembers: [],
    enableDropdown: false,
  };
  const defaultLabels = defaults.labels ?? {
    noLabels: false,
    selectedLabels: [],
    enableDropdown: false,
  };
  const defaultActivity = defaults.activity ?? {
    lastWeek: false,
    lastTwoWeeks: false,
    lastFourWeeks: false,
    withoutActivity: false,
  };

  const members = filters.members
    ? {
        noMembers: filters.members.noMembers,
        assignedToMe: filters.members.assignedToMe,
        selectedMembers: [...filters.members.selectedMembers],
        enableDropdown: filters.members.enableDropdown,
      }
    : {
        noMembers: defaultMembers.noMembers,
        assignedToMe: defaultMembers.assignedToMe,
        selectedMembers: [...defaultMembers.selectedMembers],
        enableDropdown: defaultMembers.enableDropdown,
      };

  const labels = filters.labels
    ? {
        noLabels: filters.labels.noLabels,
        selectedLabels: [...filters.labels.selectedLabels],
        enableDropdown: filters.labels.enableDropdown,
      }
    : {
        noLabels: defaultLabels.noLabels,
        selectedLabels: [...defaultLabels.selectedLabels],
        enableDropdown: defaultLabels.enableDropdown,
      };

  const activity = filters.activity
    ? {
        lastWeek: filters.activity.lastWeek,
        lastTwoWeeks: filters.activity.lastTwoWeeks,
        lastFourWeeks: filters.activity.lastFourWeeks,
        withoutActivity: filters.activity.withoutActivity,
      }
    : {
        lastWeek: defaultActivity.lastWeek,
        lastTwoWeeks: defaultActivity.lastTwoWeeks,
        lastFourWeeks: defaultActivity.lastFourWeeks,
        withoutActivity: defaultActivity.withoutActivity,
      };

  return {
    keyword: filters.keyword ?? defaults.keyword,
    members,
    cardStatus: {
      markedComplete: filters.cardStatus?.markedComplete ?? defaults.cardStatus.markedComplete,
      notMarkedComplete:
        filters.cardStatus?.notMarkedComplete ?? defaults.cardStatus.notMarkedComplete,
    },
    dueDate: {
      noDates: filters.dueDate?.noDates ?? defaults.dueDate.noDates,
      overdue: filters.dueDate?.overdue ?? defaults.dueDate.overdue,
      nextDay: filters.dueDate?.nextDay ?? defaults.dueDate.nextDay,
      nextWeek: filters.dueDate?.nextWeek ?? defaults.dueDate.nextWeek,
      nextMonth: filters.dueDate?.nextMonth ?? defaults.dueDate.nextMonth,
    },
    labels,
    activity,
    filterSnapshotCardIds:
      (filters.filterSnapshotCardIds ?? []).length > 0
        ? [...(filters.filterSnapshotCardIds ?? [])]
        : [],
  };
}
