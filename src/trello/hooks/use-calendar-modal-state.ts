import { useState, useEffect, useMemo, useRef } from 'react';
import { DateTime } from 'luxon';
import { useCard, useTrelloOperations } from '@trello/_lib/selectors';
import { mockNow, mockTimezone } from '@trello/_lib/shims/time';
import {
  toCalendarDate,
  parseISOInMockTimezone,
  fromCalendarDate,
} from '@trello/utils/calendar-date';

export function useCalendarModalState(
  cardId: string,
  isOpen: boolean,
  buttonRef?: React.RefObject<HTMLElement | null>
) {
  const card = useCard(cardId);
  const { updateCard } = useTrelloOperations();

  // State for calendar navigation - prefer showing existing due/start month
  const [viewDate, setViewDate] = useState(() => {
    if (card?.dueDate) {
      return toCalendarDate(parseISOInMockTimezone(card.dueDate));
    }
    if (card?.startDate) {
      return toCalendarDate(parseISOInMockTimezone(card.startDate));
    }
    return toCalendarDate(mockNow());
  });

  // State for date selection
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (card?.dueDate) {
      return toCalendarDate(parseISOInMockTimezone(card.dueDate));
    }
    // Default to tomorrow if no dates exist at all (fresh card)
    if (!card?.dueDate && !card?.startDate) {
      return toCalendarDate(mockNow().plus({ days: 1 }));
    }
    // No default date if start date exists but no due date
    return undefined;
  });

  // State for start date
  const [startDateEnabled, setStartDateEnabled] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>();

  // State for due date - enabled if there's an existing due date OR if no dates exist at all
  const [dueDateEnabled, setDueDateEnabled] = useState(
    !!card?.dueDate || (!card?.dueDate && !card?.startDate)
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    if (card?.dueDate) {
      return parseISOInMockTimezone(card.dueDate).toFormat('M/d/yyyy');
    }
    // Default to tomorrow
    return mockNow().plus({ days: 1 }).toFormat('M/d/yyyy');
  });
  const [dueTime, setDueTime] = useState<string>(() => {
    // Default to current time from mockNow
    return mockNow().toFormat('h:mm a');
  });

  // Track original time when modal opens for reverting on empty blur
  const originalTimeRef = useRef<string>('');

  // Track the most recent user input for time (separate from original)
  const [lastUserTimeInput, setLastUserTimeInput] = useState<string | null>(null);

  // Update state when card changes
  useEffect(() => {
    if (card?.dueDate) {
      const cardDueDateTime = parseISOInMockTimezone(card.dueDate);
      const timeStr = cardDueDateTime.toFormat('h:mm a');
      setSelectedDate(toCalendarDate(cardDueDateTime));
      setDueDate(cardDueDateTime.toFormat('M/d/yyyy'));
      setDueTime(timeStr);
      originalTimeRef.current = timeStr;
      setLastUserTimeInput(null); // Reset user input tracking
      setDueDateEnabled(true);
      // Ensure calendar opens on due date's month/year
      setViewDate(toCalendarDate(cardDueDateTime));
    } else {
      // When no existing due date, check if this is a fresh card or has start date only
      const tomorrowDate = mockNow().plus({ days: 1 });
      const defaultTimeStr = mockNow().toFormat('h:mm a');
      setDueDate(tomorrowDate.toFormat('M/d/yyyy'));
      originalTimeRef.current = defaultTimeStr;
      setLastUserTimeInput(null); // Reset user input tracking

      if (!card?.startDate) {
        // Fresh card with no dates - enable due date with tomorrow as default
        setSelectedDate(toCalendarDate(tomorrowDate));
        setDueDateEnabled(true);
        setViewDate(toCalendarDate(mockNow()));
      } else {
        // Card has start date but no due date - don't enable due date
        setSelectedDate(undefined);
        setDueDateEnabled(false);
        const startDt = parseISOInMockTimezone(card.startDate);
        setViewDate(toCalendarDate(startDt));
      }
    }

    // Handle start date
    if (card?.startDate) {
      const cardStartDateTime = parseISOInMockTimezone(card.startDate);
      setSelectedStartDate(toCalendarDate(cardStartDateTime));
      setStartDate(cardStartDateTime.toFormat('M/d/yyyy'));
      setStartDateEnabled(true);
    } else {
      setSelectedStartDate(undefined);
      setStartDate('');
      setStartDateEnabled(false);
    }
  }, [card?.dueDate, card?.startDate]);

  // Helper: auto-format raw numeric input like 11032034 -> 11/3/2034
  function autoFormatMdy(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 8) {
      const month = Number(digits.slice(0, 2));
      const day = Number(digits.slice(2, 4));
      const year = Number(digits.slice(4, 8));
      const dt = DateTime.fromObject({ year, month, day }, { zone: mockTimezone() });
      if (dt.isValid) {
        return dt.toFormat('M/d/yyyy');
      }
    }
    return input;
  }

  // Wrapped setters: also sync selected dates when input becomes a valid date
  function setStartDateString(value: string) {
    const formatted = autoFormatMdy(value);
    setStartDate(formatted);
    const dt = DateTime.fromFormat(formatted, 'M/d/yyyy', {
      zone: mockTimezone(),
    });
    if (dt.isValid) {
      setSelectedStartDate(toCalendarDate(dt));
      setStartDateEnabled(true);
    }
  }

  function setDueDateString(value: string) {
    const formatted = autoFormatMdy(value);
    setDueDate(formatted);
    const dt = DateTime.fromFormat(formatted, 'M/d/yyyy', {
      zone: mockTimezone(),
    });
    if (dt.isValid) {
      setSelectedDate(toCalendarDate(dt));
      setDueDateEnabled(true);
    }
  }

  // Helper: normalize compact time input to "h:mm a"; supports suffixes like "PM"
  function normalizeTime(value: string): string {
    const raw = value.trim();
    const upper = raw.toUpperCase();
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) return raw;

    // Already looks like h:mm a
    const parsed = DateTime.fromFormat(upper, 'h:mm a');
    if (parsed.isValid) {
      return parsed.toFormat('h:mm a');
    }

    // Detect explicit AM/PM token even without colon
    const ampmMatch = upper.match(/\b(AM|PM)\b/);
    const forcedPeriod = (ampmMatch?.[1] as 'AM' | 'PM' | undefined) ?? undefined;

    const build = (h: number, m: number, period?: 'AM' | 'PM') => {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      let mer: 'AM' | 'PM';
      if (period != null) {
        mer = period;
      } else if (h === 12) {
        mer = 'PM';
      } else if (h > 12) {
        mer = 'PM';
      } else {
        mer = 'AM';
      }
      const mm = String(m).padStart(2, '0');
      return `${hour12}:${mm} ${mer}`;
    };

    // Digits-only or digits with AM/PM
    if (digits.length <= 2) {
      let hour = Number(digits);
      if (hour === 0) hour = 12;
      if (hour >= 13 && hour <= 23) hour = hour - 12;
      return build(hour, 0, forcedPeriod);
    }

    if (digits.length === 3) {
      const hour = Number(digits.slice(0, 1)) || 12;
      const minute = Number(digits.slice(1));
      return build(hour, minute, forcedPeriod);
    }

    // 4+ digits HHMM
    const hh = Number(digits.slice(0, 2));
    const mmNum = Number(digits.slice(2, 4));
    if (forcedPeriod) {
      const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
      return build(hour12, mmNum, forcedPeriod);
    }
    return build(hh, mmNum);
  }

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

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selectedDateTime = fromCalendarDate(date);

      // Determine which date to set based on checkbox states
      if (startDateEnabled && !dueDateEnabled) {
        // Only start date is enabled - set as start date
        setSelectedStartDate(date);
        setStartDate(selectedDateTime.toFormat('M/d/yyyy'));
      } else if (!startDateEnabled && dueDateEnabled) {
        // Only due date is enabled - set as due date
        setSelectedDate(date);
        setDueDate(selectedDateTime.toFormat('M/d/yyyy'));
      } else if (startDateEnabled && dueDateEnabled) {
        // Both enabled - if date precedes start date, update start date; otherwise update due date
        if (selectedStartDate && date < selectedStartDate) {
          // Set as new start date (before current start date)
          setSelectedStartDate(date);
          setStartDate(selectedDateTime.toFormat('M/d/yyyy'));
        } else {
          // Set as due date
          setSelectedDate(date);
          setDueDate(selectedDateTime.toFormat('M/d/yyyy'));
        }
      } else {
        // Neither enabled - default to enabling due date
        setSelectedDate(date);
        setDueDate(selectedDateTime.toFormat('M/d/yyyy'));
        setDueDateEnabled(true);
      }
    }
  };

  // Handle due date checkbox change
  const handleDueDateEnabledChange = (checked: boolean) => {
    setDueDateEnabled(checked);
    if (!checked) {
      // Clear selected date when due date is unchecked
      setSelectedDate(undefined);
    } else {
      // If there's a start date, set due date to 1 day after start date
      // Otherwise, set default to tomorrow
      let defaultDueDate: DateTime;
      if (startDateEnabled && selectedStartDate) {
        defaultDueDate = DateTime.fromJSDate(selectedStartDate).plus({
          days: 1,
        });
      } else {
        defaultDueDate = mockNow().plus({ days: 1 });
      }
      setSelectedDate(toCalendarDate(defaultDueDate));
      setDueDate(defaultDueDate.toFormat('M/d/yyyy'));
    }
  };

  // Handle start date checkbox change
  const handleStartDateEnabledChange = (checked: boolean) => {
    setStartDateEnabled(checked);
    if (!checked) {
      // Clear start date when unchecked
      setSelectedStartDate(undefined);
      setStartDate('');
    } else {
      // When checked, set start date automatically
      if (selectedDate) {
        // If there's a due date, set start date to the day before
        const dayBeforeDue = fromCalendarDate(selectedDate).minus({
          days: 1,
        });
        setSelectedStartDate(toCalendarDate(dayBeforeDue));
        setStartDate(dayBeforeDue.toFormat('M/d/yyyy'));
      } else {
        // If no due date, set to current date
        const today = mockNow();
        setSelectedStartDate(toCalendarDate(today));
        setStartDate(today.toFormat('M/d/yyyy'));
      }
    }
  };

  // Handle save
  const handleSave = (onClose: () => void) => {
    const updates: {
      startDate?: string | undefined;
      dueDate?: string | undefined;
    } = {};

    // Compute day parts in mock timezone to enforce ordering
    let startDateTime: DateTime | undefined;
    if (startDateEnabled && selectedStartDate) {
      startDateTime = fromCalendarDate(selectedStartDate);
    }

    let dueDay: DateTime | undefined;
    if (dueDateEnabled && selectedDate) {
      dueDay = fromCalendarDate(selectedDate);
    }

    // If due day precedes start day, auto-shift start to the day before due
    if (startDateTime && dueDay && dueDay < startDateTime) {
      startDateTime = dueDay.minus({ days: 1 });
    }

    // Persist start date (if enabled)
    updates.startDate = startDateTime?.toISO() ?? undefined;

    // Persist due date (if enabled)
    if (dueDay) {
      // Parse the time and combine with the due day
      const normalizedTime = normalizeTime(dueTime);
      if (normalizedTime !== dueTime) setDueTime(normalizedTime);
      const timeParts = normalizedTime.split(' ');
      if (timeParts.length === 2) {
        const time = timeParts[0];
        const period = timeParts[1];
        const timePieces = time?.split(':');
        if (timePieces && timePieces.length === 2) {
          const hours = timePieces[0];
          const minutes = timePieces[1];
          let hour24 = Number(hours);

          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }

          const finalDateTime = dueDay.set({
            hour: hour24,
            minute: Number(minutes),
            second: 0,
            millisecond: 0,
          });
          updates.dueDate = finalDateTime.toISO() ?? undefined;
        }
      }
    } else {
      updates.dueDate = undefined;
    }

    updateCard({ cardId, updates });
    onClose();
  };

  // Handle remove
  const handleRemove = (onClose: () => void) => {
    updateCard({
      cardId,
      updates: {
        dueDate: undefined,
        startDate: undefined,
      },
    });
    onClose();
  };

  // Create date range for styling if both start and due dates are selected and enabled
  const dateRange = useMemo(() => {
    if (selectedStartDate && selectedDate && startDateEnabled && dueDateEnabled) {
      const start = selectedStartDate;
      const end = selectedDate;
      if (start < end) {
        return { from: start, to: end };
      }
    }
    return undefined;
  }, [selectedStartDate, selectedDate, startDateEnabled, dueDateEnabled]);

  // Computed values
  const currentMonth = DateTime.fromJSDate(viewDate).toFormat('MMMM yyyy');
  const today = toCalendarDate(mockNow());
  const modalTitle = card?.dueDate ? 'Dates' : 'Start date';

  return {
    // State values
    viewDate,
    selectedDate,
    selectedStartDate,
    startDateEnabled,
    startDate,
    dueDateEnabled,
    dueDate,
    dueTime,
    dateRange,
    originalTimeRef,
    lastUserTimeInput,

    // Computed values
    currentMonth,
    today,
    modalTitle,

    // Setters
    setViewDate,
    setStartDate: setStartDateString,
    setDueDate: setDueDateString,
    setDueTime,
    setLastUserTimeInput,

    // Handlers
    handlePreviousMonth,
    handleNextMonth,
    handlePreviousYear,
    handleNextYear,
    handleDateSelect,
    handleDueDateEnabledChange,
    handleStartDateEnabledChange,
    handleSave,
    handleRemove,
  };
}
