import { DateTime } from 'luxon';

export function mockNow(): DateTime<true> {
  return DateTime.now() as DateTime<true>;
}

export function mockNowDate(): Date {
  return new Date();
}

export function mockNowMillis(): number {
  return Date.now();
}

export function mockTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getUpcomingDayOfWeek(dt: DateTime, dayOfWeek: number): DateTime {
  const currentDayOfWeek = dt.weekday;
  let daysUntil: number;
  if (currentDayOfWeek < dayOfWeek) {
    daysUntil = dayOfWeek - currentDayOfWeek;
  } else {
    daysUntil = dayOfWeek + (7 - currentDayOfWeek);
  }
  return dt.plus({ days: daysUntil });
}

export function isToday(dt: DateTime): boolean {
  return dt.hasSame(DateTime.now(), 'day');
}

export function formatDate(date: Date, format: string): string {
  return DateTime.fromJSDate(date).toFormat(format);
}

export function configureMockTime(_params: {
  mockDatetime?: string;
  mockLocation?: { lat: number; lng: number };
}): void {
  // No-op in standalone mode
}

export function resetMockTime(): void {
  // No-op in standalone mode
}

export function stripTimezone(iso: string): string {
  const re =
    /^(\d{4}-\d{2}-\d{2})(?:([Tt\s])(\d{2}:\d{2})(?::(\d{2}))?(\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/;
  const m = re.exec(iso);
  if (!m) throw new Error('Invalid ISO-8601 date string');
  const [, ymd, sep = '', hhmm, ss = '', frac = ''] = m;
  if (!hhmm) return ymd!;
  const seconds = ss ? `:${ss}` : '';
  return `${ymd}${sep}${hhmm}${seconds}${frac}`;
}
