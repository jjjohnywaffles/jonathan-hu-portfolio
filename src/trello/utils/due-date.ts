import { DateTime } from 'luxon';
import { mockNow } from '@trello/_lib/shims/time';

export type DueDateStatus = 'overdue' | 'recently-overdue' | 'due-soon' | 'due-later';
export type StartDateStatus = 'started' | 'starts';

export type DueDateInfo = {
  status: DueDateStatus;
  bgColor: string;
  textColor: string;
  displayText: string;
};

export type StartDateInfo = {
  status: StartDateStatus;
  bgColor: string;
  textColor: string;
  displayText: string;
};

export function getDueDateInfo(dueDate: string): DueDateInfo {
  const due = DateTime.fromISO(dueDate);
  const now = mockNow();
  const diffInMinutes = due.diff(now, 'minutes').minutes;
  const diffInDays = due.diff(now, 'days').days;

  // Determine status based on time difference
  let status: DueDateStatus;

  // Within 1 minute buffer (past or future) - show red for urgency
  if (diffInMinutes >= -1 && diffInMinutes <= 1) {
    status = 'recently-overdue';
  } else if (diffInDays < -1) {
    // Greater than a day late
    status = 'overdue';
  } else if (diffInDays < 0) {
    // Less than a day late (but beyond 1 minute buffer)
    status = 'recently-overdue';
  } else {
    // Due soon: within next 24 hours + 2 minutes buffer, else due later
    const withinNextDayPlusBuffer = due < now.plus({ days: 1, minutes: 2 });
    status = withinNextDayPlusBuffer ? 'due-soon' : 'due-later';
  }

  // Determine styling based on status
  let bgColor: string;
  let textColor: string;

  switch (status) {
    case 'overdue':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'recently-overdue':
      bgColor = 'bg-red-600';
      textColor = 'text-white';
      break;
    case 'due-soon':
      bgColor = 'bg-yellow-400';
      textColor = 'text-yellow-900';
      break;
    case 'due-later':
      bgColor = '';
      textColor = 'text-gray-600';
      break;
  }

  // Format display text - include year if over a year away or in different year
  const yearDiff = Math.abs(due.year - now.year);
  const isOverYearAway = Math.abs(diffInDays) > 365;
  const isDifferentYear = due.year !== now.year;

  const displayText =
    isOverYearAway || isDifferentYear ? due.toFormat('MMM d, yyyy') : due.toFormat('MMM d');

  return {
    status,
    bgColor,
    textColor,
    displayText,
  };
}

export function getStartDateInfo(startDate: string): StartDateInfo {
  const start = DateTime.fromISO(startDate);
  const now = mockNow();
  const diffInDays = start.diff(now, 'days').days;

  // Determine status based on whether start date has passed
  const status: StartDateStatus = diffInDays <= 0 ? 'started' : 'starts';

  // Use similar styling to due dates but with different color scheme for start dates
  let bgColor: string;
  let textColor: string;

  switch (status) {
    case 'started':
      // Green styling for started tasks
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'starts':
      // Blue styling for upcoming start dates
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
  }

  // Handle special cases for yesterday, today, tomorrow using date comparison
  const startDateOnly = start.startOf('day');
  const nowDateOnly = now.startOf('day');
  const daysDiff = startDateOnly.diff(nowDateOnly, 'days').days;

  const isYesterday = daysDiff === -1;
  const isToday = daysDiff === 0;
  const isTomorrow = daysDiff === 1;

  let displayText: string;

  if (isYesterday) {
    displayText = 'yesterday';
  } else if (isToday) {
    displayText = 'today';
  } else if (isTomorrow) {
    displayText = 'tomorrow';
  } else {
    // Format display text - include year if over a year away or in different year
    const yearDiff = Math.abs(start.year - now.year);
    const isOverYearAway = Math.abs(diffInDays) > 365;
    const isDifferentYear = start.year !== now.year;

    displayText =
      isOverYearAway || isDifferentYear ? start.toFormat('MMM d, yyyy') : start.toFormat('MMM d');
  }

  return {
    status,
    bgColor,
    textColor,
    displayText,
  };
}
