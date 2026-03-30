import { DateTime } from 'luxon';
import { mockNow } from '@trello/_lib/shims/time';

// Get background color for checklist gadget based on due date status
export function getChecklistGadgetBackgroundColor(status: string | null): string {
  if (!status) return 'bg-gray-100';

  switch (status) {
    case 'overdue':
      return 'bg-red-100';
    case 'recently-overdue':
      return 'bg-red-600';
    case 'due-soon':
      return 'bg-yellow-400'; // Solid yellow to match icon styling
    case 'due-later':
    default:
      return 'bg-gray-100';
  }
}

// Get text color for checklist gadget based on due date status
export function getChecklistGadgetTextColor(status: string | null): string {
  if (!status) return 'text-gray-600';

  switch (status) {
    case 'overdue':
      return 'text-red-800';
    case 'recently-overdue':
      return 'text-white';
    case 'due-soon':
      return 'text-yellow-900'; // Darker text for better contrast
    case 'due-later':
    default:
      return 'text-gray-600';
  }
}

// Format due date for display: abbreviated month, day, and year if different
export function formatDueDateForGadget(dueDateString: string | null): string {
  if (!dueDateString) return '';

  const due = DateTime.fromISO(dueDateString);
  const now = mockNow();
  const isDifferentYear = due.year !== now.year;

  // Format: "Jan 15" or "Jan 15, 24" if different year
  return isDifferentYear
    ? due.toFormat('LLL d, yy') // "Jan 15, 24"
    : due.toFormat('LLL d'); // "Jan 15"
}
