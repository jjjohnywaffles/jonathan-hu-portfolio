import React, { memo, useMemo, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { Calendar } from '../ui/Calendar';
import { Button } from '../ui/Button';
import { CardModal } from '../ui/CardModal';
import { ModalBackHeader } from '../ui/ModalBackHeader';
import { useCalendarModalState } from '../../hooks/use-calendar-modal-state';
import { useCalendarNavigation } from '../../hooks/use-calendar-navigation';
import { useDynamicModalHeight } from '../../hooks/use-dynamic-modal-height';
import { useCalendarDateTimeState } from '../../hooks/use-calendar-date-time-state';
import { SHARED_CALENDAR_CONFIG, CALENDAR_NAV_BUTTON_STYLES } from '../../utils/calendar-config';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { mockNow, mockTimezone } from '@trello/_lib/shims/time';
import {
  toCalendarDate,
  parseISOInMockTimezone,
  fromCalendarDate,
} from '@trello/utils/calendar-date';
import {
  validateAndFormatDate,
  normalizeTime,
  parseCustomFieldValue,
} from '@trello/utils/calendar-modal-utils';
import { useTrelloOperations, useChecklistItemDueDate } from '@trello/_lib/selectors';

// Props for card calendar modal
type CardCalendarModalProps = {
  variant: 'card';
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  onBack?: () => void;
};

// Props for checklist calendar modal
type ChecklistCalendarModalProps = {
  variant: 'checklist';
  cardId: string;
  checklistId: string;
  itemIndex: number;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  onBack?: () => void;
};

// Props for custom field calendar modal
type CustomFieldCalendarModalProps = {
  variant: 'custom-field';
  cardId: string;
  fieldId: string;
  fieldName: string;
  currentValue?: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  onBack?: () => void;
};

type CalendarModalProps =
  | CardCalendarModalProps
  | ChecklistCalendarModalProps
  | CustomFieldCalendarModalProps;

// Input component types and implementations
type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const DateInput: FC<DateInputProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = 'M/D/YYYY',
  className = 'h-7 w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
}) => {
  if (disabled) {
    return (
      <div className="h-7 w-24 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-400">
        {placeholder}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};

type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const TimeInput: FC<TimeInputProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = 'h:mm a',
  className = 'h-7 w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
}) => {
  if (disabled) {
    return (
      <div className="h-7 w-20 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-400">
        {placeholder}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur(e.target.value)}
      placeholder={placeholder === 'h:mm a' ? 'Add time' : placeholder}
      className={className}
    />
  );
};

type DateTimeInputGroupProps = {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onDateBlur: (value: string) => void;
  onTimeBlur: (value: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  showLabels?: boolean;
};

const DateTimeInputGroup: FC<DateTimeInputGroupProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  onDateBlur,
  onTimeBlur,
  dateLabel = 'Date',
  timeLabel = 'Time',
  showLabels = true,
}) => {
  return (
    <div className="flex items-center gap-4">
      {/* Date Input */}
      <div className="flex items-center gap-2">
        {showLabels && <div className="text-sm font-medium text-gray-700">{dateLabel}</div>}
        <DateInput value={dateValue} onChange={onDateChange} onBlur={onDateBlur} />
      </div>

      {/* Time Input */}
      <div className="flex items-center gap-2">
        {showLabels && <div className="text-sm font-medium text-gray-700">{timeLabel}</div>}
        <TimeInput value={timeValue} onChange={onTimeChange} onBlur={onTimeBlur} />
      </div>
    </div>
  );
};

const CalendarModal: FC<CalendarModalProps> = memo(function CalendarModal(props) {
  const { variant, cardId, isOpen, onClose, buttonRef, onBack } = props as CalendarModalProps & {
    onBack?: () => void;
  };

  // Use new modal positioning with measured refine & upward shift
  const modalRef = React.useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 300,
    fallbackHeight: 420,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Use dynamic modal height hook
  const modalHeight = useDynamicModalHeight();

  // Always call hooks (React rule) - we'll conditionally use the results
  const cardState = useCalendarModalState(cardId, isOpen, buttonRef);
  const { setChecklistItemDueDate, removeChecklistItemDueDate, updateCustomFieldValue } =
    useTrelloOperations();

  // For checklist variant, we need the specific props
  let checklistId: string = '';
  let itemIndex: number = 0;
  if (variant === 'checklist') {
    const checklistProps = props as ChecklistCalendarModalProps;
    checklistId = checklistProps.checklistId;
    itemIndex = checklistProps.itemIndex;
  }
  const currentDueDate = useChecklistItemDueDate(cardId, checklistId, itemIndex);

  // For custom field variant, we need the specific props
  let fieldId: string = '';
  let fieldName: string = '';
  let currentFieldValue: string | undefined = undefined;
  if (variant === 'custom-field') {
    const cfProps = props as CustomFieldCalendarModalProps;
    fieldId = cfProps.fieldId;
    fieldName = cfProps.fieldName;
    currentFieldValue = cfProps.currentValue;
  }

  // Calendar navigation (shared between both variants)
  // Initialize calendar navigation to selected date when available
  const navInitialDate = useMemo(() => {
    if (variant === 'checklist') {
      if (currentDueDate) {
        return toCalendarDate(parseISOInMockTimezone(currentDueDate));
      }
      // default to tomorrow for checklist
      return toCalendarDate(mockNow().plus({ days: 1 }));
    } else if (variant === 'custom-field') {
      if (currentFieldValue) {
        const parsed = parseCustomFieldValue(currentFieldValue);
        if (parsed.dateTime) {
          return toCalendarDate(parsed.dateTime);
        }
      }
      // default to today for custom field
      return toCalendarDate(mockNow());
    }
    return undefined;
  }, [variant, currentDueDate, currentFieldValue]);

  const navigation = useCalendarNavigation(navInitialDate);

  // Use the new date/time state hook for checklist and custom-field variants
  const dateTimeState = useCalendarDateTimeState({
    variant,
    currentValue:
      variant === 'checklist'
        ? currentDueDate
        : variant === 'custom-field'
          ? currentFieldValue
          : undefined,
    isOpen,
    onViewDateChange: navigation.setViewDate,
  });

  // Handle date selection for all variants
  const handleDateSelect = (date: Date | undefined) => {
    if (variant === 'card') {
      cardState.handleDateSelect(date);
    } else {
      dateTimeState.handleDateSelect(date);
    }
  };

  // Handle save for checklist
  const handleChecklistSave = useCallback(() => {
    if (variant === 'checklist') {
      const finalDateTime = dateTimeState.getFinalDateTime();
      if (finalDateTime) {
        setChecklistItemDueDate({
          cardId,
          checklistId,
          itemIndex,
          dueDate: finalDateTime.toISO() ?? '',
        });
      }
      onClose();
    }
  }, [variant, dateTimeState, setChecklistItemDueDate, cardId, checklistId, itemIndex, onClose]);

  // Handle remove for checklist
  const handleChecklistRemove = useCallback(() => {
    if (variant === 'checklist') {
      removeChecklistItemDueDate({
        cardId,
        checklistId,
        itemIndex,
      });
      onClose();
    }
  }, [variant, removeChecklistItemDueDate, cardId, checklistId, itemIndex, onClose]);

  // Custom field handlers
  const handleCustomFieldSave = useCallback(() => {
    if (variant === 'custom-field') {
      const finalDateTime = dateTimeState.getFinalDateTime();
      if (finalDateTime) {
        // Store as "MMM d at h:mm a" format for display
        const displayValue = finalDateTime.toFormat("MMM d 'at' h:mm a");
        updateCustomFieldValue({
          cardId,
          fieldId,
          value: displayValue,
        });
      } else {
        updateCustomFieldValue({
          cardId,
          fieldId,
          value: undefined,
        });
      }
      onClose();
    }
  }, [variant, dateTimeState, updateCustomFieldValue, cardId, fieldId, onClose]);

  const handleCustomFieldRemove = useCallback(() => {
    if (variant === 'custom-field') {
      updateCustomFieldValue({
        cardId,
        fieldId,
        value: undefined,
      });
      onClose();
    }
  }, [variant, updateCustomFieldValue, cardId, fieldId, onClose]);

  // Keyboard handler for Enter key - save changes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Just trigger the save handler for the appropriate variant
        if (variant === 'card') {
          cardState.handleSave(onClose);
        } else if (variant === 'checklist') {
          handleChecklistSave();
        } else if (variant === 'custom-field') {
          handleCustomFieldSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, variant, cardState, onClose, handleChecklistSave, handleCustomFieldSave]);

  // Get the appropriate data based on variant
  const modalTitle =
    variant === 'card'
      ? cardState.modalTitle
      : variant === 'checklist'
        ? currentDueDate
          ? 'Edit due date'
          : 'Set due date'
        : `Edit ${fieldName}`;

  const calendarSelectedDate =
    variant === 'card' ? cardState.selectedDate : dateTimeState.selectedDate;

  const calendarViewDate = variant === 'card' ? cardState.viewDate : navigation.viewDate;

  const calendarToday = variant === 'card' ? cardState.today : navigation.today;

  if (!isOpen) return null;

  return (
    <CardModal
      ref={modalRef}
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      position={{ top: position.top, left: position.left }}
      dataAttribute="data-calendar-modal"
      buttonRef={buttonRef}
      className={modalHeight.modalClasses}
      containerClassName={modalHeight.modalContainerClasses}
      customHeader={
        onBack ? (
          <ModalBackHeader title={modalTitle} onBack={onBack} onClose={onClose} />
        ) : undefined
      }
    >
      {/* Scrollable content container */}
      <div className={modalHeight.contentClasses}>
        {/* Date and Time Inputs for Custom Field - Above Calendar */}
        {variant === 'custom-field' && (
          <div className="px-4 py-2">
            <DateTimeInputGroup
              dateValue={dateTimeState.dueDate}
              timeValue={dateTimeState.dueTime}
              onDateChange={dateTimeState.handleDateChange}
              onTimeChange={dateTimeState.handleTimeChange}
              onDateBlur={dateTimeState.handleDateBlur}
              onTimeBlur={dateTimeState.handleTimeBlur}
            />
          </div>
        )}

        {/* Calendar Section */}
        <div className="px-4 py-2">
          {/* Calendar Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={
                  variant === 'card' ? cardState.handlePreviousYear : navigation.handlePreviousYear
                }
                variant="ghost"
                size="sm"
                className={CALENDAR_NAV_BUTTON_STYLES}
              >
                &#171;
              </Button>
              <Button
                onClick={
                  variant === 'card'
                    ? cardState.handlePreviousMonth
                    : navigation.handlePreviousMonth
                }
                variant="ghost"
                size="sm"
                className={CALENDAR_NAV_BUTTON_STYLES}
              >
                &#8249;
              </Button>
            </div>

            <h3 className="text-sm font-medium text-gray-800">
              {variant === 'card' ? cardState.currentMonth : navigation.currentMonth}
            </h3>

            <div className="flex items-center gap-2">
              <Button
                onClick={
                  variant === 'card' ? cardState.handleNextMonth : navigation.handleNextMonth
                }
                variant="ghost"
                size="sm"
                className={CALENDAR_NAV_BUTTON_STYLES}
              >
                &#8250;
              </Button>
              <Button
                onClick={variant === 'card' ? cardState.handleNextYear : navigation.handleNextYear}
                variant="ghost"
                size="sm"
                className={CALENDAR_NAV_BUTTON_STYLES}
              >
                &#187;
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={calendarSelectedDate}
            onSelect={handleDateSelect}
            month={calendarViewDate}
            onMonthChange={variant === 'card' ? cardState.setViewDate : navigation.setViewDate}
            today={calendarToday}
            modifiers={
              variant === 'card'
                ? {
                    startDate: cardState.selectedStartDate ? [cardState.selectedStartDate] : [],
                    betweenDates: cardState.dateRange
                      ? (() => {
                          const dates = [];
                          const start = new Date(cardState.dateRange.from);
                          const end = new Date(cardState.dateRange.to);
                          const current = new Date(start);
                          current.setDate(current.getDate() + 1); // Start from day after start date

                          while (current < end) {
                            dates.push(new Date(current));
                            current.setDate(current.getDate() + 1);
                          }
                          return dates;
                        })()
                      : [],
                  }
                : undefined
            }
            modifiersClassNames={
              variant === 'card' ? SHARED_CALENDAR_CONFIG.modifiersClassNames : undefined
            }
            className={SHARED_CALENDAR_CONFIG.className}
            classNames={SHARED_CALENDAR_CONFIG.classNames}
          />
        </div>

        {/* Card variant: Start Date Section */}
        {variant === 'card' && (
          <div className="px-4 py-2">
            <div className="mb-2 text-sm font-medium text-gray-700">Start date</div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="start-date"
                checked={cardState.startDateEnabled}
                onChange={(e) => cardState.handleStartDateEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <DateInput
                value={cardState.startDate}
                onChange={cardState.setStartDate}
                onBlur={(value) => {
                  const { formatted, isValid, dateTime } = validateAndFormatDate(
                    value,
                    cardState.selectedStartDate
                      ? fromCalendarDate(cardState.selectedStartDate).toFormat('M/d/yyyy')
                      : undefined
                  );

                  if (isValid && dateTime) {
                    // Valid date - apply formatting
                    cardState.setStartDate(formatted);

                    // If start date is after due date, update due date to be one day after start date
                    if (cardState.dueDateEnabled && cardState.dueDate) {
                      const dueDt = DateTime.fromFormat(cardState.dueDate, 'M/d/yyyy', {
                        zone: mockTimezone(),
                      });

                      if (dueDt.isValid && dateTime > dueDt) {
                        const newDueDate = dateTime.plus({ days: 1 });
                        const newDueDateJs = toCalendarDate(newDueDate);
                        // Update both the date string and calendar selection
                        cardState.setDueDate(newDueDate.toFormat('M/d/yyyy'));
                        cardState.handleDateSelect(newDueDateJs);
                        // Update calendar view to show the due date month
                        cardState.setViewDate(newDueDateJs);
                      } else {
                        // Update calendar view to show the start date month
                        cardState.setViewDate(toCalendarDate(dateTime));
                      }
                    } else {
                      // Update calendar view to show the start date month
                      cardState.setViewDate(toCalendarDate(dateTime));
                    }
                  } else {
                    // Invalid date - formatting already handled by validateAndFormatDate
                    cardState.setStartDate(formatted);
                  }
                }}
                disabled={!cardState.startDateEnabled}
              />
            </div>
          </div>
        )}

        {/* Due Date Section for Card and Checklist variants only */}
        {variant !== 'custom-field' && (
          /* Due Date Section for Card and Checklist variants */
          <div className="px-4 py-2">
            <div className="mb-2 text-sm font-medium text-gray-700">Due date</div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="due-date"
                checked={
                  variant === 'card' ? cardState.dueDateEnabled : dateTimeState.dueDateEnabled
                }
                onChange={(e) =>
                  variant === 'card'
                    ? cardState.handleDueDateEnabledChange(e.target.checked)
                    : dateTimeState.handleDueDateEnabledChange(e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <DateInput
                value={variant === 'card' ? cardState.dueDate : dateTimeState.dueDate}
                onChange={(value) => {
                  if (variant === 'card') {
                    cardState.setDueDate(value);
                  } else {
                    dateTimeState.handleDateChange(value);
                  }
                }}
                onBlur={(value) => {
                  if (variant === 'card') {
                    const { formatted, isValid, dateTime } = validateAndFormatDate(
                      value,
                      cardState.selectedDate
                        ? fromCalendarDate(cardState.selectedDate).toFormat('M/d/yyyy')
                        : undefined
                    );
                    cardState.setDueDate(formatted);
                    if (isValid && dateTime) {
                      // Move calendar view to due date month
                      cardState.setViewDate(toCalendarDate(dateTime));

                      // If start date is enabled and currently after the new due date,
                      // update start date to be one day before the due date.
                      if (cardState.startDateEnabled && cardState.selectedStartDate) {
                        const startDt = fromCalendarDate(cardState.selectedStartDate);
                        if (dateTime < startDt) {
                          const newStart = dateTime.minus({ days: 1 });
                          cardState.setStartDate(newStart.toFormat('M/d/yyyy'));
                        }
                      }
                    }
                  } else {
                    dateTimeState.handleDateBlur(value);
                  }
                }}
                disabled={
                  variant === 'card' ? !cardState.dueDateEnabled : !dateTimeState.dueDateEnabled
                }
              />
              <TimeInput
                value={variant === 'card' ? cardState.dueTime : dateTimeState.dueTime}
                onChange={(value) => {
                  if (variant === 'card') {
                    cardState.setDueTime(value);
                    // Track user input if it's not empty
                    if (value.trim() !== '') {
                      cardState.setLastUserTimeInput(value);
                    }
                  } else {
                    dateTimeState.handleTimeChange(value);
                  }
                }}
                onBlur={(value) => {
                  if (variant === 'card') {
                    const trimmedValue = value.trim();
                    if (trimmedValue === '') {
                      // Revert to most recent user input or original time
                      if (cardState.lastUserTimeInput !== null) {
                        cardState.setDueTime(cardState.lastUserTimeInput);
                      } else {
                        cardState.setDueTime(cardState.originalTimeRef.current);
                      }
                    } else {
                      const normalized = normalizeTime(value);
                      cardState.setDueTime(normalized);
                      cardState.setLastUserTimeInput(normalized);
                    }
                  } else {
                    dateTimeState.handleTimeBlur(value);
                  }
                }}
                disabled={
                  variant === 'card' ? !cardState.dueDateEnabled : !dateTimeState.dueDateEnabled
                }
              />
            </div>
          </div>
        )}

        {/* Set Due Date Reminder Section - Available for card and checklist variants only */}
        {variant !== 'custom-field' && (
          <div className="px-4 py-2">
            <div className="mb-2 text-sm font-medium text-gray-700">Set due date reminder</div>
            <div className="relative">
              <select
                className="h-8 w-full appearance-none rounded border border-gray-300 bg-white px-3 py-1 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue="none"
              >
                <option value="none">None</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Reminders will be sent to all members and watchers of this card.
            </div>
          </div>
        )}
      </div>
      {/* End of scrollable content container */}

      {/* Action Buttons - Fixed at bottom */}
      <div
        className={`flex flex-col gap-2 border-t border-gray-200 px-4 py-2 ${modalHeight.footerClasses}`}
      >
        <Button
          onMouseDown={(e) => {
            // Use onMouseDown with preventDefault to fire before blur event
            // This prevents the double-click issue when input is focused
            e.preventDefault();
            if (variant === 'card') {
              cardState.handleSave(onClose);
            } else if (variant === 'checklist') {
              handleChecklistSave();
            } else {
              handleCustomFieldSave();
            }
          }}
          variant="ghost"
          className="h-8 w-full bg-blue-600 text-sm text-white hover:bg-blue-700"
        >
          Save
        </Button>
        <Button
          onMouseDown={(e) => {
            // Use onMouseDown with preventDefault to fire before blur event
            e.preventDefault();
            if (variant === 'card') {
              cardState.handleRemove(onClose);
            } else if (variant === 'checklist') {
              handleChecklistRemove();
            } else {
              handleCustomFieldRemove();
            }
          }}
          variant="ghost"
          className="h-8 w-full text-sm text-gray-600 hover:bg-gray-100"
        >
          Remove
        </Button>
      </div>
    </CardModal>
  );
});

export { CalendarModal };
