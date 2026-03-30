import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import {
  validateAndFormatDate,
  normalizeTime,
  parseDateTimeInputs,
  parseCustomFieldValue,
  getDefaultDates,
} from '@trello/utils/calendar-modal-utils';
import {
  toCalendarDate,
  parseISOInMockTimezone,
  fromCalendarDate,
} from '@trello/utils/calendar-date';
import { mockNow } from '@trello/_lib/shims/time';

type UseCalendarDateTimeStateProps = {
  variant: 'card' | 'checklist' | 'custom-field';
  currentValue?: string;
  isOpen: boolean;
  onViewDateChange?: (date: Date) => void;
};

export function useCalendarDateTimeState({
  variant,
  currentValue,
  isOpen,
  onViewDateChange,
}: UseCalendarDateTimeStateProps) {
  const defaults = useMemo(() => getDefaultDates(variant), [variant]);

  // Parse initial values from current value
  const initialValues = useMemo(() => {
    if (!currentValue) return defaults;

    if (variant === 'checklist') {
      const dateTime = parseISOInMockTimezone(currentValue);
      if (dateTime.isValid) {
        return {
          date: dateTime.toFormat('M/d/yyyy'),
          time: dateTime.toFormat('h:mm a'),
          selectedDate: toCalendarDate(dateTime),
        };
      }
    } else if (variant === 'custom-field') {
      const parsed = parseCustomFieldValue(currentValue);
      if (parsed.dateTime) {
        return {
          date: parsed.date!,
          time: parsed.time!,
          selectedDate: toCalendarDate(parsed.dateTime),
        };
      }
    }

    return defaults;
  }, [currentValue, variant, defaults]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialValues.selectedDate);
  const [dueDate, setDueDate] = useState(initialValues.date);
  const [dueTime, setDueTime] = useState(initialValues.time);
  const [dueDateEnabled, setDueDateEnabled] = useState(true);

  // Track if user has touched the inputs to prevent unwanted resets
  const [hasUserInput, setHasUserInput] = useState(false);

  // Track the most recent user input for time (separate from original)
  const [lastUserTimeInput, setLastUserTimeInput] = useState<string | null>(null);

  // Reset state when modal opens or current value changes (but not during active editing)
  useEffect(() => {
    if (!isOpen || hasUserInput) return;

    const newValues = currentValue ? initialValues : defaults;
    setSelectedDate(newValues.selectedDate);
    setDueDate(newValues.date);
    setDueTime(newValues.time);
    setDueDateEnabled(true);
    setLastUserTimeInput(null); // Reset user input tracking
  }, [isOpen, currentValue, initialValues, defaults, hasUserInput]);

  // Reset user input flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasUserInput(false);
      setLastUserTimeInput(null); // Reset user input tracking when modal closes
    }
  }, [isOpen]);

  const handleDateChange = useCallback((value: string) => {
    setDueDate(value);
    setHasUserInput(true);
  }, []);

  const handleDateBlur = useCallback(
    (value: string) => {
      const { formatted, isValid, dateTime } = validateAndFormatDate(
        value,
        currentValue ? initialValues.date : undefined
      );

      setDueDate(formatted);
      if (isValid && dateTime) {
        const calendarDate = toCalendarDate(dateTime);
        setSelectedDate(calendarDate);
        onViewDateChange?.(calendarDate);
      }
    },
    [currentValue, initialValues.date, onViewDateChange]
  );

  const handleTimeChange = useCallback((value: string) => {
    setDueTime(value);
    setHasUserInput(true);
    // Track user input if it's not empty
    if (value.trim() !== '') {
      setLastUserTimeInput(value);
    }
  }, []);

  const handleTimeBlur = useCallback(
    (value: string) => {
      const trimmedValue = value.trim();
      // If empty, revert to most recent user input or original time
      if (trimmedValue === '') {
        if (lastUserTimeInput !== null) {
          setDueTime(lastUserTimeInput);
        } else {
          setDueTime(initialValues.time);
        }
      } else {
        // Guard: if user typed a compact numeric time beyond 23:59, treat as invalid
        const onlyDigits = trimmedValue.replace(/\D/g, '');
        if (onlyDigits.length >= 4) {
          const firstFour = Number(onlyDigits.slice(0, 4));
          if (Number.isFinite(firstFour) && firstFour > 2359) {
            setDueTime(initialValues.time);
            setLastUserTimeInput(initialValues.time);
            return;
          }
        }

        // Normalize and validate
        const normalized = normalizeTime(value);
        const parsed = DateTime.fromFormat(normalized.toUpperCase(), 'h:mm a');
        if (!parsed.isValid) {
          setDueTime(initialValues.time);
          setLastUserTimeInput(initialValues.time);
        } else {
          setDueTime(normalized);
          setLastUserTimeInput(normalized);
        }
      }
    },
    [initialValues.time, lastUserTimeInput]
  );

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) return;

    const selectedDateTime = fromCalendarDate(date);
    setSelectedDate(date);
    setDueDate(selectedDateTime.toFormat('M/d/yyyy'));
    setDueDateEnabled(true);
    setHasUserInput(true);
  }, []);

  const handleDueDateEnabledChange = useCallback(
    (enabled: boolean) => {
      setDueDateEnabled(enabled);
      setHasUserInput(true);

      if (!enabled) {
        setSelectedDate(undefined);
      } else {
        const defaultDate = variant === 'checklist' ? mockNow().plus({ days: 1 }) : mockNow();
        setSelectedDate(toCalendarDate(defaultDate));
        setDueDate(defaultDate.toFormat('M/d/yyyy'));
      }
    },
    [variant]
  );

  // Get the final DateTime value for saving
  const getFinalDateTime = useCallback(() => {
    if (!dueDateEnabled || !selectedDate) return null;
    return parseDateTimeInputs(dueDate, dueTime, selectedDate);
  }, [dueDateEnabled, selectedDate, dueDate, dueTime]);

  return {
    selectedDate,
    dueDate,
    dueTime,
    dueDateEnabled,
    handleDateChange,
    handleDateBlur,
    handleTimeChange,
    handleTimeBlur,
    handleDateSelect,
    handleDueDateEnabledChange,
    getFinalDateTime,
  };
}
