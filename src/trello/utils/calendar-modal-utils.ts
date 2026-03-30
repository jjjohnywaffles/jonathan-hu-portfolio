import { DateTime } from 'luxon';
import { mockTimezone, mockNow } from '@trello/_lib/shims/time';
import { toCalendarDate } from '@trello/utils/calendar-date';

/**
 * Auto-format raw numeric input like 11032034 -> 11/3/2034
 */
export function autoFormatMdy(input: string): string {
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

/**
 * Normalize compact time input like "2" -> "2:00 AM", "234" -> "2:34 AM",
 * "1123" -> "11:23 AM", "1412" -> "2:12 PM", "0512" -> "5:12 AM"
 */
export function normalizeTime(input: string): string {
  const raw = input.trim();
  const upper = raw.toUpperCase();
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return raw;

  // Already in h:mm a format
  const parsed = DateTime.fromFormat(upper, 'h:mm a');
  if (parsed.isValid) {
    return parsed.toFormat('h:mm a');
  }

  // Detect explicit AM/PM token even without colon/time separator
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
    if (hour === 0) hour = 12; // treat 0 as 12
    if (hour >= 13 && hour <= 23) hour = hour - 12; // coerce 13..23 -> 1..11
    return build(hour, 0, forcedPeriod);
  }
  if (digits.length === 3) {
    // e.g. 234 PM -> 2:34 PM
    const hour = Number(digits.slice(0, 1));
    const minute = Number(digits.slice(1, 3));
    // Validate ranges
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) {
      // Invalid compact time; fall back to current time
      return mockNow().toFormat('h:mm a');
    }
    return build(hour, minute, forcedPeriod);
  }
  // 4+ digits: HHMM
  const hh = Number(digits.slice(0, 2));
  const mmNum = Number(digits.slice(2, 4));
  // Validate ranges
  if (!Number.isFinite(hh) || !Number.isFinite(mmNum) || hh > 23 || mmNum > 59) {
    return mockNow().toFormat('h:mm a');
  }
  if (forcedPeriod) {
    const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return build(hour12, mmNum, forcedPeriod);
  }
  return build(hh, mmNum);
}

/**
 * Validate and format a date input, returning the formatted date and whether it's valid
 */
export function validateAndFormatDate(
  input: string,
  fallbackDate?: string
): { formatted: string; isValid: boolean; dateTime?: DateTime } {
  const formatted = autoFormatMdy(input);
  const dt = DateTime.fromFormat(formatted, 'M/d/yyyy', {
    zone: mockTimezone(),
  });

  if (dt.isValid) {
    return { formatted, isValid: true, dateTime: dt };
  }

  // Invalid - use fallback
  const finalDate = fallbackDate || mockNow().toFormat('M/d/yyyy');
  return { formatted: finalDate, isValid: false };
}

/**
 * Parse a date/time string and combine into a DateTime object
 */
export function parseDateTimeInputs(
  dateStr: string,
  timeStr: string,
  selectedDate?: Date
): DateTime | null {
  const selectedDateTime = selectedDate
    ? DateTime.fromJSDate(selectedDate)
    : DateTime.fromFormat(dateStr, 'M/d/yyyy', { zone: mockTimezone() });

  if (!selectedDateTime.isValid) return null;

  // Strictly parse time string using Luxon to validate h:mm a format
  const parsedTime = DateTime.fromFormat(timeStr.trim().toUpperCase(), 'h:mm a', {
    zone: mockTimezone(),
  });
  if (!parsedTime.isValid) {
    return null;
  }

  const hour24 = parsedTime.hour; // guaranteed 0-23
  const minute = parsedTime.minute; // guaranteed 0-59

  return selectedDateTime.set({
    hour: hour24,
    minute,
    second: 0,
    millisecond: 0,
  });
}

/**
 * Parse custom field value which can be in multiple formats
 */
export function parseCustomFieldValue(value: string | undefined): {
  date?: string;
  time?: string;
  dateTime?: DateTime;
} {
  if (!value) return {};

  // Try new format first: "MMM d at h:mm a"
  const newFormat = DateTime.fromFormat(value, "MMM d 'at' h:mm a", {
    zone: mockTimezone(),
  });
  if (newFormat.isValid) {
    return {
      date: newFormat.toFormat('M/d/yyyy'),
      time: newFormat.toFormat('h:mm a'),
      dateTime: newFormat,
    };
  }

  // Try old format: "M/d/yyyy"
  const oldFormat = DateTime.fromFormat(value, 'M/d/yyyy', {
    zone: mockTimezone(),
  });
  if (oldFormat.isValid) {
    return {
      date: oldFormat.toFormat('M/d/yyyy'),
      time: mockNow().toFormat('h:mm a'),
      dateTime: oldFormat,
    };
  }

  return {
    date: value,
    time: mockNow().toFormat('h:mm a'),
  };
}

/**
 * Get default dates for different variants
 */
export function getDefaultDates(variant: 'card' | 'checklist' | 'custom-field') {
  const now = mockNow();
  const tomorrow = now.plus({ days: 1 });

  switch (variant) {
    case 'card':
      return {
        date: tomorrow.toFormat('M/d/yyyy'),
        time: now.toFormat('h:mm a'),
        selectedDate: toCalendarDate(tomorrow),
      };
    case 'checklist':
      return {
        date: tomorrow.toFormat('M/d/yyyy'),
        time: now.toFormat('h:mm a'),
        selectedDate: toCalendarDate(tomorrow),
      };
    case 'custom-field':
      return {
        date: now.toFormat('M/d/yyyy'),
        time: now.toFormat('h:mm a'),
        selectedDate: toCalendarDate(now),
      };
  }
}
