// Shared Calendar component configuration to eliminate duplication
// between CalendarModal and ChecklistCalendarModal

export const SHARED_CALENDAR_CONFIG = {
  // Calendar container className
  className: 'w-full [&_.rdp]:p-0 [&_.rdp-table]:w-full [&_.rdp-tbody]:w-full',

  // Calendar classNames configuration
  classNames: {
    root: 'w-full p-0',
    months: 'flex gap-0 flex-col w-full',
    month: 'flex flex-col w-full gap-1',
    table: 'w-full border-collapse table-fixed',
    week: 'flex w-full mt-1',
    weekdays: 'flex w-full',
    weekday:
      'text-muted-foreground rounded-md flex-1 font-normal text-sm select-none py-1 text-center',
    day: 'relative w-full h-7 p-0 text-center select-none flex-1 [&_button]:h-7 [&_button]:min-h-7 [&_button]:max-h-7 [&_button]:min-w-0 [&_button]:w-full [&_button]:rounded-sm [&_button]:text-sm [&_button]:p-0 [&_button:hover]:bg-gray-100 [&_button]:flex [&_button]:items-center [&_button]:justify-center',
    day_selected:
      'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800 focus:bg-blue-100 focus:text-blue-800 [&_button]:bg-blue-100 [&_button]:text-blue-800 [&_button:hover]:bg-blue-100',
    day_today: 'text-[#0079bf] underline decoration-2 underline-offset-2',
    day_outside: '[&_button]:text-gray-400',
    month_caption: 'hidden',
    nav: 'hidden',
    button_previous: 'hidden',
    button_next: 'hidden',
  },

  // Modifiers classNames for start date and date ranges (used by card calendar modal)
  modifiersClassNames: {
    startDate:
      'bg-blue-100 text-blue-800 rounded-sm [&_button]:bg-blue-100 [&_button]:text-blue-800 [&_button:hover]:bg-blue-100 [&_button]:rounded-sm',
    betweenDates:
      'bg-blue-100 text-blue-800 rounded-sm [&_button]:bg-blue-100 [&_button]:text-blue-800 [&_button:hover]:bg-blue-100 [&_button]:rounded-sm',
  },
};

// Calendar navigation button styles
export const CALENDAR_NAV_BUTTON_STYLES = 'h-8 w-8 p-0 text-2xl text-gray-600 hover:bg-gray-100';

// Modal positioning configuration for calendar modals
export const CALENDAR_MODAL_POSITIONING = {
  fallbackHeight: 400, // Calendar modal is taller
  fallbackWidth: 300, // Calendar modal is wider
};
