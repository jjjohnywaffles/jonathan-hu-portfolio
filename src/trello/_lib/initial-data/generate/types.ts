import { z } from 'zod';
import {
  trelloUserSchema,
  userSchema,
  boardSchema,
  listSchema,
  cardSchema,
  workspaceSchema,
  commentSchema,
  activitySchema,
  labelSchema,
  checklistSchema,
  customFieldDefinitionSchema,
  searchStateSchema,
  boardFilterOptionsSchema,
  cardActionRecordSchema,
  suggestedFieldTemplateSchema,
} from '@trello/_lib/types';
import { nonEmptyStringSchema } from '@trello/_lib/shims/utils';

export const TrelloUserParamsSchema = trelloUserSchema;
export type TrelloUserParams = z.infer<typeof TrelloUserParamsSchema>;

export const TrelloBoardParamsSchema = boardSchema;
export type TrelloBoardParams = z.infer<typeof TrelloBoardParamsSchema>;

export const TrelloListParamsSchema = listSchema;
export type TrelloListParams = z.infer<typeof TrelloListParamsSchema>;

export const TrelloCardParamsSchema = cardSchema;
export type TrelloCardParams = z.infer<typeof TrelloCardParamsSchema>;

export const TrelloWorkspaceParamsSchema = workspaceSchema;
export type TrelloWorkspaceParams = z.infer<typeof TrelloWorkspaceParamsSchema>;

export const TrelloCommentParamsSchema = commentSchema;
export type TrelloCommentParams = z.infer<typeof TrelloCommentParamsSchema>;

export const TrelloActivityParamsSchema = activitySchema;
export type TrelloActivityParams = z.infer<typeof TrelloActivityParamsSchema>;

export const TrelloLabelParamsSchema = labelSchema;
export type TrelloLabelParams = z.infer<typeof TrelloLabelParamsSchema>;

export const TrelloChecklistParamsSchema = checklistSchema;
export type TrelloChecklistParams = z.infer<typeof TrelloChecklistParamsSchema>;

export const TrelloCustomFieldDefinitionParamsSchema = customFieldDefinitionSchema;
export type TrelloCustomFieldDefinitionParams = z.infer<
  typeof TrelloCustomFieldDefinitionParamsSchema
>;

// Base schema for Trello store data params (used when .strict() parsing is needed)
export const TrelloStoreDataParamsBaseSchema = z.object({
  currentBoardId: nonEmptyStringSchema,
  boards: z.record(z.string(), TrelloBoardParamsSchema),
  lists: z.record(z.string(), TrelloListParamsSchema),
  cards: z.record(z.string(), TrelloCardParamsSchema),
  workspaces: z.record(z.string(), TrelloWorkspaceParamsSchema),
  comments: z.record(z.string(), TrelloCommentParamsSchema),
  activities: z.record(z.string(), TrelloActivityParamsSchema),
  labels: z.record(z.string(), TrelloLabelParamsSchema),
  checklists: z.record(z.string(), TrelloChecklistParamsSchema),
  customFieldDefinitions: z.record(z.string(), TrelloCustomFieldDefinitionParamsSchema),
  users: z.record(z.string(), userSchema),
  currentUser: TrelloUserParamsSchema,
  lastCardAction: cardActionRecordSchema.nullable(),
  search: searchStateSchema,
  boardFilters: boardFilterOptionsSchema,
  suggestedFieldTemplates: z.array(suggestedFieldTemplateSchema),
});

// Full schema with inbox list validation refinement
export const TrelloStoreDataParamsSchema = TrelloStoreDataParamsBaseSchema.refine(
  (data) => {
    // Count lists with isDraggable === false to ensure only one can exist (the inbox)
    const nonDraggableListCount = Object.values(data.lists).filter(
      (list) => list.isDraggable === false
    ).length;
    return nonDraggableListCount <= 1;
  },
  {
    message:
      'Only one non-draggable list (isDraggable: false) can exist in the dataset. This is reserved for the inbox list.',
    path: ['lists'],
  }
);
export type TrelloStoreDataParams = z.infer<typeof TrelloStoreDataParamsSchema>;
