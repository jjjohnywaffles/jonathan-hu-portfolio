import type { SuggestedFieldTemplate } from './types';

// Color constants from the ColorPickerModal for consistency
const COLORS = {
  RED: '#EB5A46',
  ORANGE: '#FF9F1A',
  YELLOW: '#F2D600',
  LIGHT_BLUE: '#00C2E0',
  BLUE: '#0079BF',
  GREEN: '#61BD4F',
  PURPLE: '#C377E0',
  PINK: '#FF78CB',
  DARK_GRAY: '#344563',
  DARK_RED: '#B04632',
  NONE: '',
} as const;

/**
 * Suggested field templates that are always available in the application.
 * These are separate from initial data and remain constant across different test scenarios.
 */
export const SUGGESTED_FIELD_TEMPLATES: SuggestedFieldTemplate[] = [
  {
    id: 'priority-template',
    name: 'Priority',
    type: 'list',
    options: [
      { label: 'Highest', color: COLORS.RED },
      { label: 'High', color: COLORS.ORANGE },
      { label: 'Medium', color: COLORS.YELLOW },
      { label: 'Low', color: COLORS.LIGHT_BLUE },
      { label: 'Lowest', color: COLORS.BLUE },
      { label: 'Not sure', color: COLORS.NONE },
    ],
    showOnFront: true,
    description: 'Set task priority levels',
    category: 'productivity',
  },
  {
    id: 'status-template',
    name: 'Status',
    type: 'list',
    options: [
      { label: 'To do', color: COLORS.ORANGE },
      { label: 'In progress', color: COLORS.LIGHT_BLUE },
      { label: 'Done', color: COLORS.BLUE },
      { label: 'In review', color: COLORS.PINK },
      { label: 'Approved', color: COLORS.PURPLE },
      { label: 'Not sure', color: COLORS.NONE },
    ],
    showOnFront: true,
    description: 'Track task status',
    category: 'productivity',
  },
  {
    id: 'risk-template',
    name: 'Risk',
    type: 'list',
    options: [
      { label: 'Highest', color: COLORS.RED },
      { label: 'High', color: COLORS.ORANGE },
      { label: 'Medium', color: COLORS.YELLOW },
      { label: 'Low', color: COLORS.LIGHT_BLUE },
      { label: 'Lowest', color: COLORS.BLUE },
      { label: 'Not sure', color: COLORS.NONE },
    ],
    showOnFront: true,
    description: 'Assess task risk level',
    category: 'tracking',
  },
  {
    id: 'effort-template',
    name: 'Effort',
    type: 'list',
    options: [
      { label: 'XL', color: COLORS.DARK_RED },
      { label: 'L', color: COLORS.RED },
      { label: 'M', color: COLORS.ORANGE },
      { label: 'S', color: COLORS.YELLOW },
      { label: 'XS', color: COLORS.GREEN },
    ],
    showOnFront: true,
    description: 'Estimate effort required',
    category: 'tracking',
  },
];
