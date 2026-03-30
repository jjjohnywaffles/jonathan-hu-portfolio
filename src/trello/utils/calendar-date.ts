import { DateTime } from 'luxon';
import { mockTimezone } from '@trello/_lib/shims/time';

const SAFE_HOUR = 12;

/**
 * Parse an ISO date string in the mocked timezone to ensure consistent calendar dates
 * across all users regardless of their local timezone.
 */
export function parseISOInMockTimezone(isoString: string): DateTime {
  // Parse the ISO string and convert it to the mock timezone
  const dt = DateTime.fromISO(isoString, { zone: mockTimezone() });
  if (!dt.isValid) {
    console.warn(`Invalid ISO date string: ${isoString}. Reason: ${dt.invalidReason}`);
  }
  return dt;
}

/**
 * Converts a Luxon DateTime into a JS Date that stays anchored on the same calendar day
 * regardless of the viewer's local timezone. Creates a Date in the local timezone with
 * the same Y-M-D values as the DateTime in the mock timezone.
 */
export function toCalendarDate(dt: DateTime): Date {
  if (!dt.isValid) {
    return dt.toJSDate();
  }

  // Create a Date in the local timezone with the same calendar day as the mock timezone
  // Use noon (SAFE_HOUR) to avoid DST edge cases
  return new Date(dt.year, dt.month - 1, dt.day, SAFE_HOUR, 0, 0, 0);
}

/**
 * Converts a JS Date (created in local timezone with Y-M-D values) back to a DateTime
 * in the mock timezone with the same Y-M-D values. This is the inverse of toCalendarDate().
 */
export function fromCalendarDate(date: Date): DateTime {
  // Extract Y-M-D values from the Date (which is in local timezone)
  // and create a DateTime with those same Y-M-D values in the mock timezone
  return DateTime.fromObject(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // JS months are 0-indexed
      day: date.getDate(),
      hour: SAFE_HOUR,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    { zone: mockTimezone() }
  );
}
