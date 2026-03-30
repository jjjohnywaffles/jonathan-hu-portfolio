import { z } from 'zod';
import { nonEmptyStringSchema, emailSchema } from '@trello/_lib/shims/utils';

// ============================================================================
// Zod Schemas (defined first, types inferred below)
// ============================================================================

export const trelloUserSchema = z.object({
  id: nonEmptyStringSchema,
  email: emailSchema,
  displayName: nonEmptyStringSchema,
  avatar: z.string().optional(),
  timezone: nonEmptyStringSchema,
});

export const userSchema = z.object({
  id: nonEmptyStringSchema,
  email: emailSchema,
  displayName: nonEmptyStringSchema,
  avatar: z.string().optional(),
});

export const searchOperatorSchema = z.enum([
  'member',
  'members',
  '@',
  'label',
  '#',
  'board',
  'list',
  'has',
  'due',
  'edited',
  'description',
  'checklist',
  'comment',
  'name',
  'is',
  'sort',
]);

export const searchFilterSchema = z.object({
  operator: searchOperatorSchema.optional(),
  value: z.string(),
  negated: z.boolean().optional(),
});

export const parsedSearchSchema = z.object({
  rawQuery: z.string(),
  freeText: z.string(),
  filters: z.array(searchFilterSchema),
  sortBy: z.enum(['created', 'edited', 'due']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

export const recentSearchSchema = z.object({
  id: nonEmptyStringSchema,
  query: z.string(),
  timestamp: z.string(),
  resultCount: z.number(),
});

export const checklistItemSchema = z.object({
  label: z.string(),
  checked: z.boolean(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

export const customFieldOptionSchema = z.object({
  label: z.string(),
  color: z.string(),
});

export const customFieldValueSchema = z.object({
  id: nonEmptyStringSchema,
  value: z.string().optional(),
});

export const boardUrlMetadataSchema = z.object({
  nextCardNumber: z.number().int().min(1),
});

export const cardUrlMetadataSchema = z.object({
  number: z.number().int().min(1).optional(),
  boardId: nonEmptyStringSchema,
});

export const cardActionTypeSchema = z.enum(['archive', 'remove-mirror', 'delete']);

export const cardActionRecordSchema = z.object({
  cardId: nonEmptyStringSchema,
  action: cardActionTypeSchema,
  listId: z.string().optional(),
  boardId: z.string().optional(),
  timestamp: z.string(),
});

export const activityDetailsSchema = z.object({
  fromListId: z.string().optional(),
  fromListTitle: z.string().optional(),
  toListId: z.string().optional(),
  toListTitle: z.string().optional(),
  templateCardId: z.string().optional(),
  fromBoardId: z.string().optional(),
  fromBoardTitle: z.string().optional(),
  toBoardId: z.string().optional(),
  toBoardTitle: z.string().optional(),
});

export const searchResultsSchema = z.object({
  cards: z.array(z.string()),
  lists: z.array(z.string()),
  boards: z.array(z.string()).optional(),
  totalCount: z.number(),
});

export const recentBoardSchema = z.object({
  id: nonEmptyStringSchema,
  title: z.string(),
  lastViewed: z.string(),
  starred: z.boolean().optional(),
});

export const searchStateSchema = z.object({
  query: z.string(),
  isActive: z.boolean(),
  parsedQuery: parsedSearchSchema.optional(),
  recentSearches: z.array(recentSearchSchema),
  recentBoards: z.array(recentBoardSchema),
  results: searchResultsSchema,
});

export const commentSchema = z.object({
  id: nonEmptyStringSchema,
  cardId: nonEmptyStringSchema,
  userId: nonEmptyStringSchema,
  boardId: nonEmptyStringSchema,
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const activityTypeSchema = z.enum([
  'create',
  'move',
  'archive',
  'unarchive',
  'complete',
  'incomplete',
  'join',
  'leave',
  'template',
  'delete',
]);

export const activitySchema = z.object({
  id: nonEmptyStringSchema,
  cardId: nonEmptyStringSchema,
  userId: nonEmptyStringSchema,
  boardId: nonEmptyStringSchema,
  type: activityTypeSchema,
  details: activityDetailsSchema,
  createdAt: z.string(),
});

export const labelSchema = z.object({
  id: nonEmptyStringSchema,
  title: z.string().optional(),
  color: z.string(),
  createdAt: z.string(),
  createdBy: nonEmptyStringSchema,
  boardId: nonEmptyStringSchema,
});

export const checklistSchema = z.object({
  id: nonEmptyStringSchema,
  cardId: nonEmptyStringSchema,
  title: z.string(),
  items: z.array(checklistItemSchema),
  hideCheckedItems: z.boolean().optional(),
});

export const suggestedFieldTemplateSchema = z.object({
  id: nonEmptyStringSchema,
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'checkbox', 'list']),
  options: z.array(customFieldOptionSchema).optional(),
  showOnFront: z.boolean(),
  description: z.string().optional(),
  category: z.enum(['productivity', 'organization', 'tracking']),
});

export const customFieldDefinitionSchema = z.object({
  id: nonEmptyStringSchema,
  boardId: nonEmptyStringSchema,
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'checkbox', 'list']),
  options: z.array(customFieldOptionSchema).optional(),
  showOnFront: z.boolean().optional(),
  createdAt: z.string(),
  createdBy: nonEmptyStringSchema,
  order: z.number(),
});

export const cardSchema = z.object({
  id: nonEmptyStringSchema,
  boardId: nonEmptyStringSchema,
  title: z.string(),
  urlMetadata: cardUrlMetadataSchema.optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  checklistIds: z.array(z.string()).optional(),
  customFields: z.array(customFieldValueSchema).optional(),
  preservedCustomFields: z.array(customFieldValueSchema).optional(),
  preservedLabelIds: z.array(z.string()).optional(),
  preservedMemberIds: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  archivedAt: z.string().optional(),
  archivedWithList: z.string().optional(),
  completed: z.boolean().optional(),
  createdBy: z.string().optional(),
  assignedTo: z.array(z.string()).optional(),
  joined: z.boolean().optional(),
  watched: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  mirrorOf: z.string().optional(),
  mirroredBy: z.array(z.string()).optional(),
  isMirror: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  preservedChecklistItems: z
    .record(
      z.string(),
      z.array(
        z.object({
          assignedTo: z.string().optional(),
          dueDate: z.string().optional(),
        })
      )
    )
    .optional(),
  deleted: z.boolean().optional(),
  deletedAt: z.string().optional(),
  suspendedFromListId: z.string().optional(),
  suspendedFromIndex: z.number().optional(),
});

export const cardRefSchema = z.object({
  type: z.literal('card'),
  cardId: nonEmptyStringSchema,
});

export const listSchema = z.object({
  id: nonEmptyStringSchema,
  boardId: nonEmptyStringSchema,
  title: z.string(),
  cardRefs: z.array(cardRefSchema),
  order: z.number(),
  isDraggable: z.boolean().optional(),
  watched: z.boolean().optional(),
  archived: z.boolean().optional(),
  archivedAt: z.string().optional(),
  archivedCardIds: z.array(z.string()).optional(),
});

export const boardSchema = z.object({
  id: nonEmptyStringSchema,
  title: z.string(),
  urlMetadata: boardUrlMetadataSchema.optional(),
  description: z.string().optional(),
  background: z.string().optional(),
  starred: z.boolean().optional(),
  workspace: z.string().optional(),
  visibility: z.enum(['private', 'workspace', 'public']).optional(),
  createdAt: z.string(),
  createdBy: nonEmptyStringSchema,
  updatedAt: z.string().optional(),
  labelIds: z.array(z.string()),
  customFieldDefinitionIds: z.array(z.string()),
  collapsedListIds: z.array(z.string()),
  commentIds: z.array(z.string()),
  activityIds: z.array(z.string()),
});

export const workspaceSchema = z.object({
  id: nonEmptyStringSchema,
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['personal', 'team']),
  members: z.array(z.string()).optional(),
  createdAt: z.string(),
  createdBy: nonEmptyStringSchema,
});

export const boardFilterOptionsSchema = z.object({
  keyword: z.string(),
  members: z
    .object({
      noMembers: z.boolean(),
      assignedToMe: z.boolean(),
      selectedMembers: z.array(z.string()),
      enableDropdown: z.boolean(),
    })
    .optional(),
  cardStatus: z.object({
    markedComplete: z.boolean(),
    notMarkedComplete: z.boolean(),
  }),
  dueDate: z.object({
    noDates: z.boolean(),
    overdue: z.boolean(),
    nextDay: z.boolean(),
    nextWeek: z.boolean(),
    nextMonth: z.boolean(),
  }),
  labels: z
    .object({
      noLabels: z.boolean(),
      selectedLabels: z.array(z.string()),
      enableDropdown: z.boolean(),
    })
    .optional(),
  activity: z
    .object({
      lastWeek: z.boolean(),
      lastTwoWeeks: z.boolean(),
      lastFourWeeks: z.boolean(),
      withoutActivity: z.boolean(),
    })
    .optional(),
  // This property was initially a `Set<string>`, but we had to change it to `string[]` which actually serializes to JSON correctly.
  // To make it backward compatible, we accept any value and transform it to `[]` if it's not an array of strings.
  filterSnapshotCardIds: z
    .unknown()
    .transform((val) =>
      Array.isArray(val) && val.every((v) => typeof v === `string`) ? val : ([] as string[])
    ),
});

export const trelloStoreDataSchema = z.object({
  currentBoardId: nonEmptyStringSchema,
  boards: z.record(z.string(), boardSchema),
  lists: z.record(z.string(), listSchema),
  cards: z.record(z.string(), cardSchema),
  workspaces: z.record(z.string(), workspaceSchema),
  comments: z.record(z.string(), commentSchema),
  activities: z.record(z.string(), activitySchema),
  labels: z.record(z.string(), labelSchema),
  checklists: z.record(z.string(), checklistSchema),
  customFieldDefinitions: z.record(z.string(), customFieldDefinitionSchema),
  users: z.record(z.string(), userSchema),
  currentUser: trelloUserSchema,
  lastCardAction: cardActionRecordSchema.nullable(),
  search: searchStateSchema,
  boardFilters: boardFilterOptionsSchema,
  boardFiltersByBoardId: z.record(z.string(), boardFilterOptionsSchema).optional(),
  suggestedFieldTemplates: z.array(suggestedFieldTemplateSchema),
});

// ============================================================================
// Type Exports (inferred from Zod schemas)
// ============================================================================

export type TrelloUser = z.infer<typeof trelloUserSchema>;
export type User = z.infer<typeof userSchema>;
export type SearchOperator = z.infer<typeof searchOperatorSchema>;
export type SearchFilter = z.infer<typeof searchFilterSchema>;
export type ParsedSearch = z.infer<typeof parsedSearchSchema>;
export type RecentSearch = z.infer<typeof recentSearchSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type CustomFieldOption = z.infer<typeof customFieldOptionSchema>;
export type CustomFieldValue = z.infer<typeof customFieldValueSchema>;
export type CardActionType = z.infer<typeof cardActionTypeSchema>;
export type CardActionRecord = z.infer<typeof cardActionRecordSchema>;
export type ActivityDetails = z.infer<typeof activityDetailsSchema>;
export type SearchResults = z.infer<typeof searchResultsSchema>;
export type RecentBoard = z.infer<typeof recentBoardSchema>;
export type SearchState = z.infer<typeof searchStateSchema>;
export type BoardUrlMetadata = z.infer<typeof boardUrlMetadataSchema>;
export type CardUrlMetadata = z.infer<typeof cardUrlMetadataSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Label = z.infer<typeof labelSchema>;
export type Checklist = z.infer<typeof checklistSchema>;
export type SuggestedFieldTemplate = z.infer<typeof suggestedFieldTemplateSchema>;
export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>;
export type Card = z.infer<typeof cardSchema>;
export type CardRef = z.infer<typeof cardRefSchema>;
export type List = z.infer<typeof listSchema>;
export type Board = z.infer<typeof boardSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type BoardFilterOptions = z.infer<typeof boardFilterOptionsSchema>;
export type TrelloStoreData = z.infer<typeof trelloStoreDataSchema>;

// ============================================================================
// Types that cannot be inferred from Zod schemas
// ============================================================================
