// Base filter options shared by both inbox and board
export type BaseFilterOptions = {
  keyword: string;
  cardStatus: {
    markedComplete: boolean;
    notMarkedComplete: boolean;
  };
  dueDate: {
    noDates: boolean;
    overdue: boolean;
    nextDay: boolean;
    nextWeek: boolean;
    nextMonth: boolean;
  };
};

// Inbox-specific filters
export type InboxFilterOptions = BaseFilterOptions & {
  variant: 'inbox';
  cardCreated: {
    lastWeek: boolean;
    lastTwoWeeks: boolean;
    lastMonth: boolean;
  };
};

// Board-specific filters
export type BoardFilterOptions = BaseFilterOptions & {
  variant: 'board';
  members: {
    noMembers: boolean;
    assignedToMe: boolean;
    selectedMembers: string[];
    enableDropdown: boolean;
  };
  labels: {
    noLabels: boolean;
    selectedLabels: string[];
    enableDropdown: boolean;
  };
  activity: {
    lastWeek: boolean;
    lastTwoWeeks: boolean;
    lastFourWeeks: boolean;
    withoutActivity: boolean;
  };
};

// Union type for all filter options
export type FilterOptions = InboxFilterOptions | BoardFilterOptions;

// Type guards
export function isInboxFilter(filter: FilterOptions): filter is InboxFilterOptions {
  return filter.variant === 'inbox';
}

export function isBoardFilter(filter: FilterOptions): filter is BoardFilterOptions {
  return filter.variant === 'board';
}

// Factory functions
export function createInboxFilters(): InboxFilterOptions {
  return {
    variant: 'inbox',
    keyword: '',
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
    cardCreated: {
      lastWeek: false,
      lastTwoWeeks: false,
      lastMonth: false,
    },
  };
}

export function createBoardFilters(): BoardFilterOptions {
  return {
    variant: 'board',
    keyword: '',
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
    members: {
      noMembers: false,
      assignedToMe: false,
      selectedMembers: [],
      enableDropdown: false,
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
  };
}
