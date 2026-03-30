import type { ComponentType } from 'react';
import { IconLabel } from '../../icons/card-modal/icon-label';
import { IconClock } from '../../icons/card-modal/icon-clock';
import { IconChecklist } from '../../icons/card-modal/icon-checklist';
import { IconMembers } from '../../icons/card-modal/icon-members';
import { IconAttachment } from '../../icons/card-modal/icon-attachment';
import { IconCustomFields } from '../../icons/card-modal/icon-custom-fields';

export type MenuItemConfig = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  testId: string;
  ariaLabel?: string;
  handlerKey: 'labels' | 'dates' | 'checklist' | 'members' | 'attachment' | 'customFields';
  shortcut?: string;
};

export const MENU_ITEMS: MenuItemConfig[] = [
  {
    icon: IconLabel,
    title: 'Labels',
    description: 'Organize, categorize, and prioritize',
    testId: 'card-back-labels-button',
    ariaLabel: 'Labels',
    handlerKey: 'labels',
    shortcut: 'l',
  },
  {
    icon: IconClock,
    title: 'Dates',
    description: 'Start dates, due dates, and reminders',
    testId: 'card-back-due-date-button',
    ariaLabel: 'Dates',
    handlerKey: 'dates',
    shortcut: 'd',
  },
  {
    icon: IconChecklist,
    title: 'Checklist',
    description: 'Add subtasks',
    testId: 'card-back-checklist-button',
    ariaLabel: 'Checklist',
    handlerKey: 'checklist',
    shortcut: '-',
  },
  {
    icon: IconMembers,
    title: 'Members',
    description: 'Assign members',
    testId: 'card-back-members-button',
    ariaLabel: 'Members',
    handlerKey: 'members',
    shortcut: 'm',
  },
  // Temporarily disabled attachments menu item
  /*
  {
    icon: IconAttachment,
    title: "Attachment",
    description: "Attach links, pages, work items, and more",
    testId: "card-back-attachment-button",
    ariaLabel: "Attachment",
    handlerKey: "attachment",
  },
  */
  {
    icon: IconCustomFields,
    title: 'Custom Fields',
    description: 'Create your own fields',
    testId: 'card-back-custom-fields-button',
    ariaLabel: 'Custom Fields',
    handlerKey: 'customFields',
  },
];
