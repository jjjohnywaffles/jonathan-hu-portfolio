import { useState } from 'react';
import { DateTime } from 'luxon';
import { mockNow } from '@trello/_lib/shims/time';
import { toCalendarDate, fromCalendarDate } from '@trello/utils/calendar-date';

export function useCalendarNavigation(initialDate?: Date) {
  // State for calendar navigation
  const [viewDate, setViewDate] = useState(() => initialDate ?? toCalendarDate(mockNow()));

  // Calendar navigation handlers
  const handlePreviousMonth = () => {
    setViewDate((prev) => {
      const dt = fromCalendarDate(prev).minus({ months: 1 });
      return toCalendarDate(dt);
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const dt = fromCalendarDate(prev).plus({ months: 1 });
      return toCalendarDate(dt);
    });
  };

  const handlePreviousYear = () => {
    setViewDate((prev) => {
      const dt = fromCalendarDate(prev).minus({ years: 1 });
      return toCalendarDate(dt);
    });
  };

  const handleNextYear = () => {
    setViewDate((prev) => {
      const dt = fromCalendarDate(prev).plus({ years: 1 });
      return toCalendarDate(dt);
    });
  };

  // Computed values
  const currentMonth = fromCalendarDate(viewDate).toFormat('MMMM yyyy');
  const today = toCalendarDate(mockNow());

  return {
    viewDate,
    setViewDate,
    currentMonth,
    today,
    handlePreviousMonth,
    handleNextMonth,
    handlePreviousYear,
    handleNextYear,
  };
}
