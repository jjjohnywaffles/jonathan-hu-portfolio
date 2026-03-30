import { DateTime } from 'luxon';
import type {
  Card,
  CardRef,
  List,
  TrelloStoreData,
  Comment,
  TrelloUser,
  Activity,
  Label,
  CustomFieldDefinition,
  CustomFieldValue,
  BoardFilterOptions,
  Board,
  Checklist,
} from './types';
import {
  assignCardUrlMetadata,
  ensureBoardUrlMetadata,
  stripCardUrlSequence,
} from './utils/url-meta';
import {
  ensureInboxList as ensureInboxListHelper,
  normalizeTrelloUrlMetadata,
  shouldNormalizeTrelloUrlMetadata,
} from './utils/url-normalizer';
import { cloneBoardFilters, createDefaultBoardFilters } from '@trello/utils/board-filter-utils';
import { parseSearchQuery } from '@trello/utils/search-parser';
import { executeSearch } from '@trello/utils/search-engine';
import type { OperationDefinitions } from '@trello/_lib/shims/types';
import { mockNow } from '@trello/_lib/shims/time';
import { nn } from '@trello/_lib/shims/utils';

// Define the data structure without the function properties
type TrelloData = Omit<
  TrelloStoreData,
  'addCard' | 'copyCard' | 'addList' | 'updateListTitle' | 'reorderLists'
>;

// Helper functions for normalized structure
function findListContainingCard(state: TrelloStoreData, cardId: string): List | null {
  for (const list of Object.values(state.lists)) {
    if (list.cardRefs.some((ref) => ref.cardId === cardId)) {
      return list;
    }
  }
  return null;
}

// Get all lists for a board, sorted by order
function getBoardLists(state: TrelloStoreData, boardId: string): List[] {
  return Object.values(state.lists)
    .filter((list) => list.boardId === boardId && !list.archived)
    .sort((a, b) => a.order - b.order);
}

// Get all cards for a board
function getBoardCards(state: TrelloStoreData, boardId: string): Card[] {
  return Object.values(state.cards).filter((card) => card.boardId === boardId);
}

// Get next order value for a new list in a board
function getNextListOrder(state: TrelloStoreData, boardId: string): number {
  const boardLists = Object.values(state.lists).filter((list) => list.boardId === boardId);
  if (boardLists.length === 0) return 0;
  return Math.max(...boardLists.map((list) => list.order)) + 1;
}

function removeCardFromList(list: List, cardId: string): void {
  list.cardRefs = list.cardRefs.filter((ref) => ref.cardId !== cardId);
}

function addCardToList(list: List, cardId: string, index?: number): void {
  const cardRef: CardRef = { type: 'card', cardId };

  if (index !== undefined && index >= 0 && index <= list.cardRefs.length) {
    list.cardRefs.splice(index, 0, cardRef);
  } else {
    list.cardRefs.push(cardRef);
  }
}

// Helper to create custom fields from board definitions
function createCustomFieldsFromDefinitions(
  definitions: CustomFieldDefinition[],
  preservedFields?: CustomFieldValue[]
): CustomFieldValue[] {
  return definitions.map((def) => {
    const preservedField = preservedFields?.find((f) => f.id === def.id);
    return {
      id: def.id,
      value: preservedField?.value ?? undefined,
    };
  });
}

// Helper to copy checklists from a source card to a new card
function copyCardChecklists(
  state: TrelloStoreData,
  sourceCard: Card,
  newCardId: string,
  options: { resetChecked?: boolean; removeAssignments?: boolean } = {}
): string[] {
  const { resetChecked = true, removeAssignments = true } = options;

  if (!sourceCard.checklistIds || sourceCard.checklistIds.length === 0) {
    return [];
  }

  const copiedChecklistIds: string[] = [];

  for (const checklistId of sourceCard.checklistIds) {
    const sourceChecklist = state.checklists[checklistId];
    if (!sourceChecklist) continue;

    const newChecklistId = `checklist-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
    const newChecklist: Checklist = {
      id: newChecklistId,
      cardId: newCardId,
      title: sourceChecklist.title,
      items: sourceChecklist.items.map((item) => ({
        ...item,
        checked: resetChecked ? false : item.checked,
        assignedTo: removeAssignments ? undefined : item.assignedTo,
      })),
    };

    state.checklists[newChecklistId] = newChecklist;
    copiedChecklistIds.push(newChecklistId);
  }

  return copiedChecklistIds;
}

// Card Operations
// Helper: collect original + all mirrors linked to a card
function getLinkedCardIds(state: TrelloStoreData, baseCardId: string): string[] {
  const base = state.cards[baseCardId];
  if (!base) return [];

  // If this is a mirror pointing to an original, operate on the original + all its mirrors
  if (base.isMirror && base.mirrorOf) {
    const original = state.cards[base.mirrorOf];
    const mirrors = original?.mirroredBy ?? [];
    const set = new Set<string>([base.mirrorOf, ...mirrors]);
    return Array.from(set);
  }

  // Otherwise this is the original (or a non-mirror) — operate on it + its mirrors
  const mirrors = base.mirroredBy ?? [];
  const set = new Set<string>([baseCardId, ...mirrors]);
  return Array.from(set);
}

// Helper: map a list of label IDs from one board to another by color/title, creating if needed
function mapLabelIdsForBoard(
  state: TrelloStoreData,
  sourceBoardId: string,
  targetBoardId: string,
  sourceLabelIds: string[] | undefined
): string[] | undefined {
  if (!sourceLabelIds || sourceLabelIds.length === 0) return undefined;
  if (sourceBoardId === targetBoardId) return [...sourceLabelIds];

  const targetBoard = state.boards[targetBoardId];
  if (!targetBoard) return undefined;
  const targetBoardLabels = targetBoard.labelIds
    .map((labelId) => state.labels[labelId])
    .filter((label): label is Label => label != null);

  const out: string[] = [];
  for (const srcId of sourceLabelIds) {
    const src = state.labels[srcId];
    if (!src) continue;
    let match = targetBoardLabels.find((l) => l.color === src.color && l.title === src.title);
    if (!match && !src.title) {
      match = targetBoardLabels.find((l) => l.color === src.color && !l.title);
    }
    if (match) {
      out.push(match.id);
      continue;
    }
    const newLabelId = `label-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
    const newLabel: Label = {
      id: newLabelId,
      title: src.title,
      color: src.color,
      createdAt: mockNow().toISO(),
      createdBy: state.currentUser.id,
      boardId: targetBoard.id,
    };
    state.labels[newLabelId] = newLabel;
    targetBoard.labelIds.push(newLabelId);
    out.push(newLabelId);
  }
  return out.length > 0 ? out : undefined;
}

function updateCard(
  state: TrelloStoreData,
  params: { cardId: string; updates: Partial<Omit<Card, 'id' | 'boardId'>> }
) {
  const { cardId, updates } = params;

  const base = state.cards[cardId];
  if (!base) throw new Error('Card not found');

  // Determine all linked cards to update (original + mirrors)
  const linkedIds = getLinkedCardIds(state, cardId);
  if (linkedIds.length === 0) return;

  // Apply updates to each linked card, mapping labels across boards if needed
  for (const targetId of linkedIds) {
    const target = state.cards[targetId];
    if (!target) continue;

    const nextUpdates: Partial<Omit<Card, 'id' | 'boardId'>> = { ...updates };

    // If updating labels, map IDs for target board consistency
    if (updates.labelIds) {
      nextUpdates.labelIds = mapLabelIdsForBoard(
        state,
        base.boardId,
        target.boardId,
        updates.labelIds
      );
    }

    Object.assign(target, nextUpdates);
  }
}

function moveCard(
  state: TrelloStoreData,
  params: {
    cardId: string;
    targetListId: string;
    targetIndex?: number;
    targetBoardId?: string;
    sourceListId?: string;
    sourceIndex?: number;
  }
) {
  const { cardId, targetListId, targetIndex, targetBoardId, sourceListId, sourceIndex } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const targetList = state.lists[targetListId];
  if (!targetList) throw new Error('Target list not found');

  // Find source list and specific reference
  let sourceList: List;
  let currentRef: CardRef;

  if (sourceListId && sourceIndex !== undefined) {
    // Use provided source list and index for precise reference removal
    const foundSourceList = state.lists[sourceListId];
    if (!foundSourceList) throw new Error('Source list not found');
    sourceList = foundSourceList;

    const foundCurrentRef = sourceList.cardRefs[sourceIndex];
    if (!foundCurrentRef || foundCurrentRef.cardId !== cardId) {
      throw new Error('Card reference not found at specified index');
    }
    currentRef = foundCurrentRef;

    // Remove the specific reference by index
    sourceList.cardRefs.splice(sourceIndex, 1);
  } else {
    // Fallback to finding the list and first matching reference
    const foundSourceList = findListContainingCard(state, cardId);
    if (!foundSourceList) throw new Error('Card not found in any list');
    sourceList = foundSourceList;

    const foundCurrentRef = sourceList.cardRefs.find((ref) => ref.cardId === cardId);
    if (!foundCurrentRef) throw new Error('Card reference not found');
    currentRef = foundCurrentRef;

    // Remove only the first matching reference
    const refIndex = sourceList.cardRefs.findIndex((ref) => ref === currentRef);
    if (refIndex !== -1) {
      sourceList.cardRefs.splice(refIndex, 1);
    }
  }

  // Determine if this is a cross-board move
  const actualTargetBoardId = targetBoardId ?? targetList.boardId;
  const isMovingBoards = card.boardId !== actualTargetBoardId;

  // If moving to a different board, handle label mapping and mirror cleanup
  if (isMovingBoards) {
    const sourceBoard = state.boards[card.boardId];
    const targetBoard = state.boards[actualTargetBoardId];

    if (!sourceBoard || !targetBoard) throw new Error('Board not found');

    // Note: Mirror references will continue to work across boards
    // The card record will be updated with new board ID and remapped labels

    // Map labels from source board to target board
    if (card.labelIds && card.labelIds.length > 0) {
      const mappedLabelIds: string[] = [];

      for (const sourceLabelId of card.labelIds) {
        const sourceLabel = state.labels[sourceLabelId];
        if (sourceLabel) {
          // Try to find matching label in target board by color and title
          let matchingTargetLabel = targetBoard.labelIds
            .map((labelId) => state.labels[labelId])
            .filter((label) => label != null)
            .find(
              (label) => label.color === sourceLabel.color && label.title === sourceLabel.title
            );

          // If no exact match, try to find by color only (for labels without titles)
          if (!matchingTargetLabel && !sourceLabel.title) {
            matchingTargetLabel = targetBoard.labelIds
              .map((labelId) => state.labels[labelId])
              .filter((label) => label != null)
              .find((label) => label.color === sourceLabel.color && !label.title);
          }

          if (matchingTargetLabel) {
            mappedLabelIds.push(matchingTargetLabel.id);
          } else {
            // Create the missing label on the target board
            const newLabelId = `label-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
            const newLabel: Label = {
              id: newLabelId,
              title: sourceLabel.title,
              color: sourceLabel.color,
              createdAt: mockNow().toISO(),
              createdBy: state.currentUser.id,
              boardId: targetBoard.id, // Add boardId for normalized structure
            };

            // Add the new label to normalized collection and target board
            state.labels[newLabelId] = newLabel;
            targetBoard.labelIds.push(newLabelId);
            mappedLabelIds.push(newLabelId);
          }
        }
      }

      // Update the card's labelIds with the mapped ones
      card.labelIds = mappedLabelIds;
    }

    // Handle members when moving between boards
    // Since we don't have workspace access logic implemented yet,
    // we keep all assigned members. In the future, we might filter based on workspace access.
    // At minimum, the current user (shaya) should always be retained if they were assigned.

    // Move comments to the new board
    const commentsToMove = sourceBoard.commentIds.filter((commentId) => {
      const comment = state.comments[commentId];
      return comment && comment.cardId === cardId;
    });

    if (commentsToMove.length > 0) {
      // Remove comments from source board
      sourceBoard.commentIds = sourceBoard.commentIds.filter(
        (commentId) => !commentsToMove.includes(commentId)
      );

      // Add comments to target board
      targetBoard.commentIds.push(...commentsToMove);

      // Update each comment's boardId
      commentsToMove.forEach((commentId) => {
        const comment = state.comments[commentId];
        if (comment) {
          comment.boardId = actualTargetBoardId;
        }
      });
    }

    // Update card's board reference
    card.boardId = actualTargetBoardId;
  }

  // Handle custom fields when moving to/from inbox
  const isMovingToInbox = targetListId === 'inbox';
  const isMovingFromInbox = sourceList.id === 'inbox';

  if (isMovingToInbox) {
    // Moving TO inbox: preserve custom fields, labels, and members
    // Also preserve checklist item assignments and due dates, then strip them
    if (card.checklistIds && card.checklistIds.length > 0) {
      const preserved: Record<string, Array<{ assignedTo?: string; dueDate?: string }>> = {};
      for (const clId of card.checklistIds) {
        const cl = state.checklists[clId];
        if (!cl) continue;
        preserved[clId] = cl.items.map((it) => ({
          assignedTo: it.assignedTo,
          dueDate: it.dueDate,
        }));
        // Strip assign/due for inbox restriction
        cl.items.forEach((it) => {
          it.assignedTo = undefined;
          it.dueDate = undefined;
        });
      }
      // Store preserved metadata on the card
      card.preservedChecklistItems = preserved;
    }
    if (card.customFields && card.customFields.length > 0) {
      card.preservedCustomFields = [...card.customFields];
      card.customFields = undefined;
    }
    if (card.labelIds && card.labelIds.length > 0) {
      card.preservedLabelIds = [...card.labelIds];
      card.labelIds = undefined;
    }
    if (card.assignedTo && card.assignedTo.length > 0) {
      card.preservedMemberIds = [...card.assignedTo];
      // Keep only the current user when moving to inbox
      card.assignedTo = card.assignedTo.filter((memberId) => memberId === state.currentUser.id);
    }
  } else if (isMovingFromInbox) {
    // Moving FROM inbox to a board
    const targetBoard = state.boards[actualTargetBoardId];

    // Restore custom fields
    if (targetBoard && targetBoard.customFieldDefinitionIds.length > 0) {
      const targetFieldDefinitions = targetBoard.customFieldDefinitionIds
        .map((id) => state.customFieldDefinitions[id])
        .filter((f): f is CustomFieldDefinition => f != null);
      card.customFields = createCustomFieldsFromDefinitions(
        targetFieldDefinitions,
        card.preservedCustomFields
      );
      card.preservedCustomFields = undefined;
    }

    // Restore labels - create on target board if needed
    if (card.preservedLabelIds && card.preservedLabelIds.length > 0 && targetBoard) {
      const newLabelIds: string[] = [];
      for (const labelId of card.preservedLabelIds) {
        const sourceLabel = state.labels[labelId];
        if (sourceLabel) {
          // Check if target board already has this label
          const existingLabel = targetBoard.labelIds?.find((boardLabelId) => {
            const boardLabel = state.labels[boardLabelId];
            return (
              boardLabel &&
              boardLabel.color === sourceLabel.color &&
              boardLabel.title === sourceLabel.title
            );
          });

          if (existingLabel) {
            newLabelIds.push(existingLabel);
          } else {
            // Create new label on target board
            const newLabelId = `label-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            state.labels[newLabelId] = {
              id: newLabelId,
              boardId: targetBoard.id,
              title: sourceLabel.title,
              color: sourceLabel.color,
              createdAt: mockNow().toISO(),
              createdBy: 'system',
            };
            targetBoard.labelIds = [...(targetBoard.labelIds || []), newLabelId];
            newLabelIds.push(newLabelId);
          }
        }
      }
      card.labelIds = newLabelIds;
      card.preservedLabelIds = undefined;
    }

    // Restore checklist item assignments and due dates if preserved on card
    if (card.preservedChecklistItems && card.checklistIds) {
      for (const clId of card.checklistIds) {
        const preservedItems = card.preservedChecklistItems[clId];
        const cl = state.checklists[clId];
        if (!preservedItems || !cl) continue;
        const len = Math.min(preservedItems.length, cl.items.length);
        for (let i = 0; i < len; i++) {
          const item = nn(cl.items[i]);
          const preserved = preservedItems[i];
          item.assignedTo = preserved?.assignedTo;
          item.dueDate = preserved?.dueDate;
        }
      }
      // Clear preserved metadata after restoration
      card.preservedChecklistItems = undefined;
    }

    // Don't restore members when moving from inbox
    if (card.preservedMemberIds) {
      card.preservedMemberIds = undefined;
    }

    stripCardUrlSequence(card);
  }

  // Mirror suspension: if an ORIGINAL moves into Inbox, temporarily remove its mirrors
  if (!card.isMirror && isMovingToInbox) {
    const mirrorIds = card.mirroredBy ?? [];
    for (const mirrorId of mirrorIds) {
      const mirrorCard = state.cards[mirrorId];
      if (!mirrorCard) continue;
      const mirrorList = findListContainingCard(state, mirrorId);
      if (!mirrorList) continue;
      const idx = mirrorList.cardRefs.findIndex((ref) => ref.cardId === mirrorId);
      if (idx === -1) continue;
      mirrorCard.suspendedFromListId = mirrorList.id;
      mirrorCard.suspendedFromIndex = idx;
      mirrorList.cardRefs.splice(idx, 1);
    }
  }

  // Mirror restoration moved below after original is inserted

  // Add to target list, preserving the same reference type
  if (targetIndex !== undefined && targetIndex >= 0) {
    targetList.cardRefs.splice(targetIndex, 0, currentRef);
  } else {
    targetList.cardRefs.push(currentRef);
  }

  // Mirror restoration: if an ORIGINAL moves out of Inbox, restore mirrors to saved positions
  if (!card.isMirror && isMovingFromInbox && targetListId !== 'inbox') {
    const mirrorIds = card.mirroredBy ?? [];
    // If we inserted the original into the same list that a mirror will restore into,
    // adjust the mirror's saved index when the original sits before it.
    const originalIndexInTarget = targetList.cardRefs.findIndex((ref) => ref.cardId === card.id);
    for (const mirrorId of mirrorIds) {
      const mirrorCard = state.cards[mirrorId];
      if (!mirrorCard) continue;
      const listIdToRestore = mirrorCard.suspendedFromListId;
      const indexToRestore = mirrorCard.suspendedFromIndex;
      if (!listIdToRestore || indexToRestore == null) continue;
      const restoreList = state.lists[listIdToRestore];
      if (!restoreList) {
        mirrorCard.suspendedFromListId = undefined;
        mirrorCard.suspendedFromIndex = undefined;
        continue;
      }
      const alreadyPresent = restoreList.cardRefs.some((ref) => ref.cardId === mirrorId);
      if (!alreadyPresent) {
        let adjustedIndex = indexToRestore;
        if (
          restoreList.id === targetList.id &&
          originalIndexInTarget !== -1 &&
          originalIndexInTarget <= indexToRestore
        ) {
          adjustedIndex = indexToRestore + 1;
        }
        const clampedIndex = Math.max(0, Math.min(adjustedIndex, restoreList.cardRefs.length));
        restoreList.cardRefs.splice(clampedIndex, 0, {
          type: 'card',
          cardId: mirrorId,
        });
      }
      mirrorCard.suspendedFromListId = undefined;
      mirrorCard.suspendedFromIndex = undefined;
    }
  }

  const targetBoardRecord = state.boards[targetList.boardId];
  if (targetBoardRecord) {
    if (card.isMirror === true && !isMovingToInbox) {
      assignCardUrlMetadata(card, targetBoardRecord, { skipSequence: true });
    } else if (!isMovingToInbox) {
      const needsNewSequence =
        isMovingFromInbox ||
        isMovingBoards ||
        card.urlMetadata?.number == null ||
        card.urlMetadata?.boardId !== targetBoardRecord.id;
      if (needsNewSequence) {
        assignCardUrlMetadata(card, targetBoardRecord, { forceSequence: true });
      }
    }
  }

  // Log activity with detailed move information
  addActivity(state, {
    cardId,
    type: 'move',
    details: {
      fromListId: sourceList.id,
      fromListTitle: sourceList.title,
      toListId: targetList.id,
      toListTitle: targetList.title,
    },
  });
}

function archiveCard(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const timestamp = mockNow().toISO();
  const cardList = findListContainingCard(state, cardId);

  // Apply archive status
  card.archived = true;
  card.archivedAt = timestamp;

  // Log activity
  addActivity(state, {
    cardId,
    type: 'archive',
    details: {},
  });

  state.lastCardAction = {
    cardId,
    action: 'archive',
    listId: cardList?.id,
    boardId: card.boardId,
    timestamp,
  };
}

function unarchiveCard(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Apply unarchive status
  card.archived = false;
  card.archivedAt = undefined;
  card.archivedWithList = undefined;

  // Note: Card should already be in a list, as we don't remove cards from lists when archiving
  // If for some reason it's not in any list, we don't know where to put it back

  // Log activity
  addActivity(state, {
    cardId,
    type: 'unarchive',
    details: {},
  });
}

function deleteCard(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const timestamp = mockNow().toISO();

  // Ensure no checklist content remains associated with this card
  // so it cannot be indexed or matched by search.
  clearAllChecklists(state, { cardId });

  // Remove all references to this card from lists
  for (const list of Object.values(state.lists)) {
    const filtered = list.cardRefs.filter((ref) => ref.cardId !== cardId);
    if (filtered.length !== list.cardRefs.length) {
      list.cardRefs = filtered;
    }
  }

  // Remove all comments for this card
  const board = state.boards[card.boardId];
  if (board) {
    // Remove comments associated with this card
    const commentsToRemove = board.commentIds.filter((commentId) => {
      const comment = state.comments[commentId];
      return comment && comment.cardId === cardId;
    });
    commentsToRemove.forEach((commentId) => {
      delete state.comments[commentId];
    });
    board.commentIds = board.commentIds.filter(
      (commentId) => !commentsToRemove.includes(commentId)
    );

    // Remove activities associated with this card
    const activitiesToRemove = board.activityIds.filter((activityId) => {
      const activity = state.activities[activityId];
      return activity && activity.cardId === cardId;
    });
    activitiesToRemove.forEach((activityId) => {
      delete state.activities[activityId];
    });
    board.activityIds = board.activityIds.filter(
      (activityId) => !activitiesToRemove.includes(activityId)
    );
  }

  // Mark card as deleted but keep record so mirrors can render placeholder
  card.deleted = true;
  card.deletedAt = timestamp;
  card.archived = false;
  card.archivedAt = undefined;
  card.archivedWithList = undefined;
  card.completed = false;
  card.description = undefined;
  // Clear the title to prevent free-text search hits on deleted cards
  card.title = '';
  card.assignedTo = undefined;
  card.labelIds = undefined;
  card.customFields = undefined;
  card.checklistIds = undefined;
  card.dueDate = undefined;
  card.startDate = undefined;
  card.image = undefined;
  card.watched = false;
  card.preservedCustomFields = undefined;
  card.preservedLabelIds = undefined;
  card.preservedMemberIds = undefined;

  state.lastCardAction = {
    cardId,
    action: 'delete',
    listId: undefined,
    boardId: card.boardId,
    timestamp,
  };

  // Log activity
  addActivity(state, {
    cardId,
    type: 'delete',
    details: {},
  });
}

function toggleCardCompletion(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  if (card.isTemplate) {
    return;
  }

  const newCompletedStatus = !card.completed;

  // Determine all linked cards (original + mirrors) and apply the same completed status
  const linkedIds = getLinkedCardIds(state, cardId);
  for (const id of linkedIds) {
    const target = state.cards[id];
    if (!target) continue;

    updateCard(state, {
      cardId: id,
      updates: { completed: newCompletedStatus },
    });

    addActivity(state, {
      cardId: id,
      type: newCompletedStatus ? 'complete' : 'incomplete',
      details: {},
    });

    // If any linked card is in the inbox and marked complete, archive it
    if (newCompletedStatus) {
      const cardList = findListContainingCard(state, id);
      if (cardList?.id === 'inbox') {
        archiveCard(state, { cardId: id });
      }
    }
  }
}

// List Operations
function updateListTitle(state: TrelloStoreData, params: { listId: string; title: string }) {
  const { listId, title } = params;

  const list = state.lists[listId];
  if (!list) throw new Error('List not found');

  list.title = title;
}

function reorderLists(
  state: TrelloStoreData,
  params: { sourceIndex: number; destinationIndex: number }
) {
  const { sourceIndex, destinationIndex } = params;

  const boardLists = getBoardLists(state, state.currentBoardId);
  console.log(`Reordering: sourceIndex=${sourceIndex}, destinationIndex=${destinationIndex}`);
  console.log(
    `Board lists:`,
    boardLists.map((l) => `${l.title}(${l.order})`)
  );

  if (
    sourceIndex < 0 ||
    sourceIndex >= boardLists.length ||
    destinationIndex < 0 ||
    destinationIndex >= boardLists.length
  ) {
    throw new Error('Invalid list indices');
  }

  if (sourceIndex === destinationIndex) return;

  // Get the list being moved
  const sourceList = boardLists[sourceIndex];
  if (!sourceList) return;

  // Create a list without the source list to calculate proper positions
  const otherLists = boardLists.filter((_, index) => index !== sourceIndex);

  // Calculate new order value for the moved list
  let newOrder: number;

  if (destinationIndex === 0) {
    // Moving to first position
    const firstList = otherLists[0];
    newOrder = firstList ? firstList.order - 1 : 0;
  } else if (destinationIndex >= otherLists.length) {
    // Moving to last position
    const lastList = otherLists[otherLists.length - 1];
    newOrder = lastList ? lastList.order + 1 : 1;
  } else {
    // Moving between two lists
    // When moving right, we need to account for the fact that destination index
    // refers to the position in the original array, but we're working with otherLists
    let prevList: List | null = null;
    let nextList: List | null = null;

    if (destinationIndex > sourceIndex) {
      // Moving right: we want to insert after the item at destinationIndex-1 in otherLists
      const insertAfterIndex = destinationIndex - 1;
      prevList = otherLists[insertAfterIndex] ?? null;
      nextList = otherLists[insertAfterIndex + 1] ?? null;
    } else {
      // Moving left: we want to insert before the item at destinationIndex in otherLists
      prevList = destinationIndex > 0 ? (otherLists[destinationIndex - 1] ?? null) : null;
      nextList = otherLists[destinationIndex] ?? null;
    }

    if (prevList && nextList) {
      newOrder = (prevList.order + nextList.order) / 2;
    } else if (prevList) {
      newOrder = prevList.order + 1;
    } else if (nextList) {
      newOrder = nextList.order - 1;
    } else {
      newOrder = 0;
    }
  }

  // Update the source list's order
  const sourceListRef = state.lists[sourceList.id];
  if (sourceListRef) {
    sourceListRef.order = newOrder;
  }
}

function reorderCards(
  state: TrelloStoreData,
  params: { listId: string; sourceIndex: number; destinationIndex: number }
) {
  const { listId, sourceIndex, destinationIndex } = params;

  const list = state.lists[listId];
  if (!list) throw new Error('List not found');

  if (sourceIndex < 0 || sourceIndex >= list.cardRefs.length) {
    throw new Error('Invalid source index');
  }
  if (destinationIndex < 0 || destinationIndex >= list.cardRefs.length) {
    throw new Error('Invalid destination index');
  }

  const [movedCardRef] = list.cardRefs.splice(sourceIndex, 1);
  if (movedCardRef) {
    list.cardRefs.splice(destinationIndex, 0, movedCardRef);
  }
}

function sortCards(
  state: TrelloStoreData,
  params: {
    listId: string;
    sortBy: 'newest' | 'oldest' | 'alphabetical' | 'dueDate';
  }
) {
  const { listId, sortBy } = params;

  const list = state.lists[listId];
  if (!list) throw new Error('List not found');

  // Get all cards for this list
  const cards = list.cardRefs
    .map((ref) => state.cards[ref.cardId])
    .filter((card): card is Card => card != null && !card.archived);

  if (sortBy === 'dueDate') {
    const ordered = sortCardsByDueDateOrder(cards);
    list.cardRefs = ordered.map((card) => ({ type: 'card', cardId: card.id }));
    return;
  }

  // Sort cards based on criteria
  cards.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'alphabetical':
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      default:
        return 0;
    }
  });

  // Update the list with sorted card refs
  list.cardRefs = cards.map((card) => ({ type: 'card', cardId: card.id }));
}

function sortCardsByDueDateOrder(cards: Card[]): Card[] {
  if (cards.length === 0) {
    return [];
  }

  const nowMillis = mockNow().toMillis();
  const upcoming: Array<{ card: Card; dueMillis: number }> = [];
  const overdue: Array<{ card: Card; dueMillis: number }> = [];
  const withoutDue: Card[] = [];

  for (const card of cards) {
    if (!card.dueDate) {
      withoutDue.push(card);
      continue;
    }
    const dueDate = DateTime.fromISO(card.dueDate);
    if (!dueDate.isValid) {
      withoutDue.push(card);
      continue;
    }
    const dueMillis = dueDate.toMillis();
    if (dueMillis >= nowMillis) {
      upcoming.push({ card, dueMillis });
    } else {
      overdue.push({ card, dueMillis });
    }
  }

  upcoming.sort((a, b) => a.dueMillis - b.dueMillis);
  overdue.sort((a, b) => b.dueMillis - a.dueMillis);

  return [
    ...upcoming.map((entry) => entry.card),
    ...withoutDue,
    ...overdue.map((entry) => entry.card),
  ];
}

// Collapsed List Operations
function toggleListCollapse(state: TrelloStoreData, params: { listId: string }) {
  const { listId } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  const isCollapsed = currentBoard.collapsedListIds.includes(listId);
  if (isCollapsed) {
    currentBoard.collapsedListIds = currentBoard.collapsedListIds.filter((id) => id !== listId);
  } else {
    currentBoard.collapsedListIds.push(listId);
  }
}

function collapseAllLists(state: TrelloStoreData) {
  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  // Get all list IDs from the current board
  const boardLists = getBoardLists(state, state.currentBoardId);
  const allListIds = boardLists.map((list) => list.id);

  // Set collapsed list IDs to include all lists
  currentBoard.collapsedListIds = [...allListIds];
}

function expandAllLists(state: TrelloStoreData) {
  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  // Clear all collapsed list IDs to expand all lists
  currentBoard.collapsedListIds = [];
}

function expandList(state: TrelloStoreData, params: { listId: string }) {
  const { listId } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  currentBoard.collapsedListIds = currentBoard.collapsedListIds.filter((id) => id !== listId);
}

// Board Operations
function createDefaultListsForBoard(state: TrelloStoreData, boardId: string): void {
  const defaultListTitles = ['To Do', 'Doing', 'Done'];

  defaultListTitles.forEach((title) => {
    const listId = `list-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
    const order = getNextListOrder(state, boardId);

    const list: List = {
      id: listId,
      boardId,
      title,
      cardRefs: [],
      order,
      isDraggable: true,
    };

    state.lists[listId] = list;
  });
}

function createBoard(
  state: TrelloStoreData,
  params: {
    title: string;
    description?: string;
    workspaceId?: string;
    template?: 'basic' | 'kanban' | 'scrum';
  }
): string {
  const {
    title,
    description = '',
    workspaceId = 'workspace-personal',
    template: _template = 'basic',
  } = params;
  const now = mockNow().toISO();
  const boardId = `board-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  const newBoard: Board = {
    id: boardId,
    title,
    description,
    background: '#0079BF',
    starred: false,
    workspace: workspaceId,
    visibility: 'private',
    createdAt: now,
    createdBy: state.currentUser.id,
    labelIds: [], // Will be populated after creating labels
    customFieldDefinitionIds: [],
    collapsedListIds: [],
    commentIds: [],
    activityIds: [],
  };

  ensureBoardUrlMetadata(newBoard);

  // Add board to store
  state.boards[boardId] = newBoard;

  // Create default labels in normalized collection
  const defaultLabels = [
    { id: `${boardId}-label-green`, color: 'green' },
    { id: `${boardId}-label-yellow`, color: 'yellow' },
    { id: `${boardId}-label-orange`, color: 'orange' },
    { id: `${boardId}-label-red`, color: 'red' },
    { id: `${boardId}-label-purple`, color: 'purple' },
    { id: `${boardId}-label-blue`, color: 'blue' },
  ];

  defaultLabels.forEach((labelConfig) => {
    const label: Label = {
      id: labelConfig.id,
      color: labelConfig.color,
      createdAt: now,
      createdBy: state.currentUser.id,
      boardId: boardId,
    };
    state.labels[label.id] = label;
    newBoard.labelIds.push(label.id);
  });

  createDefaultListsForBoard(state, boardId);

  // Add to recent boards
  state.search.recentBoards.unshift({
    id: boardId,
    title,
    lastViewed: now,
    starred: false,
  });

  // Keep only last 10 recent boards
  if (state.search.recentBoards.length > 10) {
    state.search.recentBoards = state.search.recentBoards.slice(0, 10);
  }

  return boardId;
}

function switchBoard(state: TrelloStoreData, params: { boardId: string }) {
  const { boardId } = params;
  const board = state.boards[boardId];

  if (!board) {
    console.error(`Board ${boardId} not found`);
    return;
  }

  saveBoardFiltersFor(state, state.currentBoardId);

  // Update current board
  state.currentBoardId = boardId;
  loadBoardFiltersForBoard(state, boardId);

  // Update recent boards (move to top)
  const now = mockNow().toISO();
  state.search.recentBoards = state.search.recentBoards.filter((b) => b.id !== boardId);
  state.search.recentBoards.unshift({
    id: boardId,
    title: board.title,
    lastViewed: now,
    starred: board.starred || false,
  });
}

function updateBoard(
  state: TrelloStoreData,
  params: {
    boardId: string;
    updates: Partial<Omit<Board, 'id' | 'createdAt' | 'createdBy'>>;
  }
) {
  const { boardId, updates } = params;
  const board = state.boards[boardId];

  if (!board) {
    console.error(`Board ${boardId} not found`);
    return;
  }

  // Update board
  Object.assign(board, {
    ...updates,
    updatedAt: mockNow().toISO(),
  });

  // Update recent boards if title changed
  if (updates.title) {
    const recentBoard = state.search.recentBoards.find((b) => b.id === boardId);
    if (recentBoard) {
      recentBoard.title = updates.title;
    }
  }
}

function toggleBoardStar(state: TrelloStoreData, params?: { boardId?: string }) {
  const boardId = params?.boardId ?? state.currentBoardId;
  const board = state.boards[boardId];
  if (!board) {
    console.error(`Board ${boardId} not found`);
    return;
  }

  board.starred = !board.starred;
  board.updatedAt = mockNow().toISO();
}

// Convenience aliases
function addCard(
  state: TrelloStoreData,
  params: { listId: string; title: string; position?: number }
) {
  const { listId, title, position } = params;

  const list = state.lists[listId];
  if (!list) throw new Error('List not found');

  const currentBoard = state.boards[list.boardId];
  if (!currentBoard) throw new Error('Board not found');

  const now = mockNow().toISO();
  const cardId = `card-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Create custom fields array with all existing custom field definitions
  const customFieldDefinitions = currentBoard.customFieldDefinitionIds
    .map((id) => state.customFieldDefinitions[id])
    .filter((f): f is CustomFieldDefinition => f != null);
  const customFields = createCustomFieldsFromDefinitions(customFieldDefinitions);

  const newCard: Card = {
    id: cardId,
    boardId: list.boardId,
    title,
    createdAt: now,
    createdBy: state.currentUser.id,
    updatedAt: now,
    customFields: customFields.length > 0 ? customFields : undefined,
  };

  // Add card to global cards store
  state.cards[cardId] = newCard;

  if (newCard.isMirror === true) {
    assignCardUrlMetadata(newCard, currentBoard, { skipSequence: true });
  } else if (list.id !== 'inbox') {
    assignCardUrlMetadata(newCard, currentBoard, { forceSequence: true });
  }

  // Add card reference to the list at specified position or end
  addCardToList(list, cardId, position);

  // Log activity for card creation
  addActivity(state, {
    cardId,
    type: 'create',
    details: {
      toListId: listId,
      toListTitle: list.title,
    },
  });

  return cardId;
}

function copyCard(
  state: TrelloStoreData,
  params: {
    sourceCardId: string;
    targetListId: string;
    targetIndex: number;
    title: string;
    keepLabels?: boolean;
    keepComments?: boolean;
    keepMembers?: boolean;
    keepChecklists?: boolean;
    keepCustomFields?: boolean;
    targetBoardId?: string; // Optional target board ID for cross-board copying
  }
) {
  const {
    sourceCardId,
    targetListId,
    targetIndex,
    title,
    keepLabels = false,
    keepComments = false,
    keepMembers = false,
    keepChecklists = false,
    keepCustomFields = false,
    targetBoardId: _targetBoardId,
  } = params;

  const sourceCard = state.cards[sourceCardId];
  if (!sourceCard) throw new Error('Source card not found');

  const targetList = state.lists[targetListId];
  if (!targetList) throw new Error('Target list not found');

  const sourceBoard = state.boards[sourceCard.boardId];
  const targetBoard = state.boards[targetList.boardId];
  if (!sourceBoard || !targetBoard) throw new Error('Board not found');

  const currentUserId = state.currentUser.id;

  const newCardId = `card-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Create custom fields array with target board's custom field definitions
  const targetFieldDefinitions = targetBoard.customFieldDefinitionIds
    .map((id) => state.customFieldDefinitions[id])
    .filter((f): f is CustomFieldDefinition => f != null);
  const customFields = createCustomFieldsFromDefinitions(
    targetFieldDefinitions,
    keepCustomFields ? (sourceCard.customFields ?? sourceCard.preservedCustomFields) : undefined
  );

  // Map labels from source board to target board if copying across boards
  let mappedLabelIds: string[] = [];
  if (keepLabels && sourceCard.labelIds && sourceCard.labelIds.length > 0) {
    if (sourceCard.boardId === targetList.boardId) {
      // Same board copy - keep original label IDs
      mappedLabelIds = [...sourceCard.labelIds];
    } else {
      // Cross-board copy - map labels by color and title, creating missing ones
      const targetBoardLabels = targetBoard.labelIds
        .map((labelId) => state.labels[labelId])
        .filter((label) => label != null);

      for (const sourceLabelId of sourceCard.labelIds) {
        const sourceLabel = state.labels[sourceLabelId];
        if (sourceLabel) {
          // Try to find matching label in target board by color and title
          let matchingTargetLabel = targetBoardLabels.find(
            (label) => label.color === sourceLabel.color && label.title === sourceLabel.title
          );

          // If no exact match, try to find by color only (for labels without titles)
          if (!matchingTargetLabel && !sourceLabel.title) {
            matchingTargetLabel = targetBoardLabels.find(
              (label) => label.color === sourceLabel.color && !label.title
            );
          }

          if (matchingTargetLabel) {
            mappedLabelIds.push(matchingTargetLabel.id);
          } else {
            // Create the missing label on the target board
            const newLabelId = `label-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
            const newLabel: Label = {
              id: newLabelId,
              title: sourceLabel.title,
              color: sourceLabel.color,
              createdAt: mockNow().toISO(),
              createdBy: state.currentUser.id,
              boardId: targetBoard.id, // Add boardId for normalized structure
            };

            // Add the new label to normalized collection and target board
            state.labels[newLabelId] = newLabel;
            targetBoard.labelIds.push(newLabelId);
            mappedLabelIds.push(newLabelId);
          }
        }
      }
    }
  }

  const copiedAssignedTo =
    keepMembers && sourceCard.assignedTo ? [...sourceCard.assignedTo] : undefined;
  const hasCurrentUser = copiedAssignedTo?.includes(currentUserId) ?? false;

  const newCard: Card = {
    id: newCardId,
    boardId: targetList.boardId,
    title,
    description: sourceCard.description,
    image: sourceCard.image,
    labelIds: mappedLabelIds.length > 0 ? mappedLabelIds : undefined,
    checklistIds: keepChecklists ? [] : undefined, // Will be populated after copying checklists
    startDate: sourceCard.startDate,
    dueDate: sourceCard.dueDate,
    attachments: [...(sourceCard.attachments || [])],
    assignedTo: copiedAssignedTo,
    joined: hasCurrentUser ? (sourceCard.joined ?? true) : undefined,
    watched: hasCurrentUser ? (sourceCard.watched ?? false) : false,
    createdAt: mockNow().toISO(),
    createdBy: state.currentUser.id,
    customFields: customFields.length > 0 ? customFields : undefined,
    completed: sourceCard.completed,
  };

  // Add card to global cards store
  state.cards[newCardId] = newCard;

  if (newCard.isMirror === true) {
    assignCardUrlMetadata(newCard, targetBoard, { skipSequence: true });
  } else if (targetListId !== 'inbox') {
    assignCardUrlMetadata(newCard, targetBoard, { forceSequence: true });
  }

  // Copy checklists if requested
  if (keepChecklists) {
    const copiedChecklistIds = copyCardChecklists(state, sourceCard, newCardId, {
      resetChecked: false, // Keep original checked state
      removeAssignments: false, // Keep assignments
    });
    newCard.checklistIds = copiedChecklistIds.length > 0 ? copiedChecklistIds : undefined;
  }

  // Add card reference to target list at the specified position
  addCardToList(targetList, newCardId, targetIndex);

  // Copy comments if requested
  if (keepComments) {
    // Find comments for the source card from normalized collection
    const sourceComments = Object.values(state.comments).filter(
      (comment) => comment.cardId === sourceCardId
    );

    for (const sourceComment of sourceComments) {
      const newComment: Comment = {
        id: `comment-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`,
        cardId: newCardId,
        userId: sourceComment.userId,
        boardId: targetBoard.id, // Add boardId for normalized structure
        content: sourceComment.content,
        createdAt: mockNow().toISO(),
      };

      // Add to normalized collection and board's commentIds
      state.comments[newComment.id] = newComment;
      targetBoard.commentIds.push(newComment.id);
    }
  }

  // Log activity
  addActivity(state, {
    cardId: newCardId,
    type: 'create',
    details: {
      toListId: targetListId,
      toListTitle: targetList.title,
    },
  });

  return newCardId;
}

// Mirror card operation
// Refactored: create a distinct card record linked to the original via `mirrorOf`
function mirrorCard(
  state: TrelloStoreData,
  params: {
    sourceCardId: string;
    targetListId: string;
    targetIndex: number;
  }
) {
  const { sourceCardId, targetListId, targetIndex } = params;

  const sourceCard = state.cards[sourceCardId];
  if (!sourceCard) throw new Error('Source card not found');
  if (sourceCard.deleted) {
    throw new Error('Cannot mirror a deleted card');
  }

  const targetList = state.lists[targetListId];
  if (!targetList) throw new Error('Target list not found');

  const targetBoard = state.boards[targetList.boardId];
  const sourceBoard = state.boards[sourceCard.boardId];
  if (!targetBoard || !sourceBoard) throw new Error('Board not found');

  // Create a new card ID for the mirror
  const newCardId = `card-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Map labels from source board to target board when needed
  let mappedLabelIds: string[] | undefined = undefined;
  if (sourceCard.labelIds && sourceCard.labelIds.length > 0) {
    if (sourceBoard.id === targetBoard.id) {
      mappedLabelIds = [...sourceCard.labelIds];
    } else {
      const targetBoardLabels = targetBoard.labelIds
        .map((labelId) => state.labels[labelId])
        .filter((label): label is Label => label != null);
      const collected: string[] = [];
      for (const sourceLabelId of sourceCard.labelIds) {
        const sourceLabel = state.labels[sourceLabelId];
        if (!sourceLabel) continue;
        let matching = targetBoardLabels.find(
          (label) => label.color === sourceLabel.color && label.title === sourceLabel.title
        );
        if (!matching && !sourceLabel.title) {
          matching = targetBoardLabels.find(
            (label) => label.color === sourceLabel.color && !label.title
          );
        }
        if (matching) {
          collected.push(matching.id);
        } else {
          const newLabelId = `label-${mockNow().valueOf()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          const newLabel: Label = {
            id: newLabelId,
            title: sourceLabel.title,
            color: sourceLabel.color,
            createdAt: mockNow().toISO(),
            createdBy: state.currentUser.id,
            boardId: targetBoard.id,
          };
          state.labels[newLabelId] = newLabel;
          targetBoard.labelIds.push(newLabelId);
          collected.push(newLabelId);
        }
      }
      mappedLabelIds = collected;
    }
  }

  // Create custom fields array with target board definitions, preserving values
  const targetFieldDefinitions = targetBoard.customFieldDefinitionIds
    .map((id) => state.customFieldDefinitions[id])
    .filter((f): f is CustomFieldDefinition => f != null);
  const customFields = createCustomFieldsFromDefinitions(
    targetFieldDefinitions,
    sourceCard.customFields ?? sourceCard.preservedCustomFields
  );

  // Copy checklists to the mirror card (mirrors have their own state)
  const copiedChecklistIds = copyCardChecklists(state, sourceCard, newCardId, {
    resetChecked: false,
    removeAssignments: false,
  });

  const newCard: Card = {
    id: newCardId,
    boardId: targetBoard.id,
    title: sourceCard.title,
    description: sourceCard.description,
    image: sourceCard.image,
    labelIds: mappedLabelIds?.length ? mappedLabelIds : undefined,
    checklistIds: copiedChecklistIds.length ? copiedChecklistIds : undefined,
    startDate: sourceCard.startDate,
    dueDate: sourceCard.dueDate,
    attachments: [...(sourceCard.attachments || [])],
    assignedTo: sourceCard.assignedTo ? [...sourceCard.assignedTo] : undefined,
    joined: sourceCard.joined ?? undefined,
    watched: sourceCard.watched ?? false,
    createdAt: mockNow().toISO(),
    createdBy: state.currentUser.id,
    customFields: customFields.length > 0 ? customFields : undefined,
    completed: sourceCard.completed,
    // Mirror linkage
    isMirror: true,
    mirrorOf: sourceCardId,
    mirroredBy: [],
  };

  // Add mirror card to global store
  state.cards[newCardId] = newCard;

  assignCardUrlMetadata(newCard, targetBoard, { skipSequence: true });

  // Add to target list as a regular card reference
  if (targetIndex >= 0 && targetIndex <= targetList.cardRefs.length) {
    targetList.cardRefs.splice(targetIndex, 0, {
      type: 'card',
      cardId: newCardId,
    });
  } else {
    targetList.cardRefs.push({ type: 'card', cardId: newCardId });
  }

  // Track mirror on source card by cardId
  if (!sourceCard.mirroredBy) {
    sourceCard.mirroredBy = [];
  }
  sourceCard.mirroredBy.push(newCardId);

  // Log activity against the mirror card
  addActivity(state, {
    cardId: newCardId,
    type: 'create',
    details: {
      toListId: targetListId,
      toListTitle: targetList.title,
    },
  });

  return newCardId;
}

function removeMirrorCard(
  state: TrelloStoreData,
  params: {
    cardId: string;
    listId: string;
    mirrorIndex?: number;
  }
) {
  const { cardId, listId, mirrorIndex } = params;

  const cardRecord = state.cards[cardId];
  if (!cardRecord) throw new Error('Card not found');

  const list = state.lists[listId];
  if (!list) throw new Error('List not found');

  if (mirrorIndex !== undefined) {
    // Remove specific reference by index (regardless of type)
    const ref = list.cardRefs[mirrorIndex];
    if (ref && ref.cardId === cardId) {
      list.cardRefs.splice(mirrorIndex, 1);
    }
  } else {
    // Remove first reference for this cardId
    const firstIndex = list.cardRefs.findIndex((ref) => ref.cardId === cardId);
    if (firstIndex !== -1) {
      list.cardRefs.splice(firstIndex, 1);
    }
  }

  // If this is a mirror card, update the original card's mirroredBy list
  if (cardRecord.isMirror && cardRecord.mirrorOf) {
    const original = state.cards[cardRecord.mirrorOf];
    if (original?.mirroredBy) {
      const updated = original.mirroredBy.filter((id) => id !== cardId);
      original.mirroredBy = updated.length > 0 ? updated : undefined;
    }
  }

  // If the removed reference was for a mirror card, delete the mirror card record
  if (cardRecord.isMirror) {
    // Clean up any checklists belonging to this mirror card
    if (cardRecord.checklistIds && cardRecord.checklistIds.length > 0) {
      for (const checklistId of cardRecord.checklistIds) {
        delete state.checklists[checklistId];
      }
    }
    delete state.cards[cardId];
  }

  // Log activity
  addActivity(state, {
    cardId,
    type: 'delete',
    details: {
      fromListId: listId,
      fromListTitle: list.title,
    },
  });

  state.lastCardAction = {
    cardId,
    action: 'remove-mirror',
    listId,
    boardId: list.boardId,
    timestamp: mockNow().toISO(),
  };
}

function addList(state: TrelloStoreData, params: { title: string }) {
  const { title } = params;

  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) throw new Error('Current board not found');

  const listId = `list-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
  const order = getNextListOrder(state, state.currentBoardId);

  const newList: List = {
    id: listId,
    boardId: state.currentBoardId,
    title,
    cardRefs: [],
    order,
    isDraggable: true,
  };

  // Add list to global lists store
  state.lists[listId] = newList;

  return listId;
}

function copyList(state: TrelloStoreData, params: { listId: string; title: string }) {
  const { listId, title } = params;

  // Find the source list
  const sourceList = state.lists[listId];
  if (!sourceList) return '';
  const sourceBoard = state.boards[sourceList.boardId];
  if (!sourceBoard) return '';

  // Create new list with new ID
  const newListId = `list-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Get the source list's order and insert after it
  const boardLists = getBoardLists(state, sourceList.boardId);
  const sourceIndex = boardLists.findIndex((l) => l.id === listId);
  let newOrder: number;
  if (sourceIndex >= 0 && sourceIndex < boardLists.length - 1) {
    const currentList = boardLists[sourceIndex];
    const nextList = boardLists[sourceIndex + 1];
    if (currentList && nextList) {
      newOrder = (currentList.order + nextList.order) / 2;
    } else {
      newOrder = sourceList.order + 1;
    }
  } else {
    newOrder = sourceList.order + 1;
  }

  const newList: List = {
    id: newListId,
    boardId: sourceList.boardId,
    title,
    cardRefs: [],
    order: newOrder,
    isDraggable: sourceList.isDraggable,
  };

  // Add to lists store
  state.lists[newListId] = newList;

  // Process card references: duplicate all cards (mirrors are real cards)
  for (const cardRef of sourceList.cardRefs) {
    // Create a full copy
    const sourceCard = state.cards[cardRef.cardId];
    if (!sourceCard) continue;

    const newCardId = `card-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

    // Copy checklists if they exist
    const copiedChecklistIds = copyCardChecklists(state, sourceCard, newCardId);

    // Create the new card
    const { urlMetadata: _sourceCardUrlMetadata, ...cardWithoutUrlMetadata } = sourceCard;
    const newCard: Card = {
      ...cardWithoutUrlMetadata,
      id: newCardId,
      createdAt: mockNow().toISO(),
      createdBy: state.currentUser.id,
      updatedAt: mockNow().toISO(),
      checklistIds: copiedChecklistIds.length > 0 ? copiedChecklistIds : undefined,
    };

    state.cards[newCardId] = newCard;
    if (newCard.isMirror === true) {
      assignCardUrlMetadata(newCard, sourceBoard, { skipSequence: true });
    } else if (newList.id !== 'inbox') {
      assignCardUrlMetadata(newCard, sourceBoard, { forceSequence: true });
    }
    newList.cardRefs.push({ type: 'card', cardId: newCardId });
  }

  return newListId;
}

function moveList(
  state: TrelloStoreData,
  params: {
    listId: string;
    targetBoardId: string;
    targetPosition: number;
  }
) {
  const { listId, targetBoardId, targetPosition } = params;

  // Find the list to move
  const listToMove = state.lists[listId];
  if (!listToMove) return;

  // Get target board
  const targetBoard = state.boards[targetBoardId];
  if (!targetBoard) return;

  // If moving within the same board
  if (targetBoardId === listToMove.boardId) {
    // Get all lists for the board (including the one being moved)
    const boardLists = getBoardLists(state, targetBoardId);
    // Remove the list being moved from consideration for position calculation
    // Also filter out inbox, archived, and non-draggable lists to match UI
    const otherLists = boardLists.filter(
      (list) =>
        list.id !== listId && list.id !== 'inbox' && !list.archived && list.isDraggable !== false
    );

    // Calculate new order based on target position (1-indexed)
    let newOrder: number;
    if (targetPosition <= 1 || otherLists.length === 0) {
      // Moving to first position
      const firstList = otherLists[0];
      newOrder = firstList ? firstList.order - 1 : 0;
    } else if (targetPosition > otherLists.length) {
      // Moving to last position
      const lastList = otherLists[otherLists.length - 1];
      newOrder = lastList ? lastList.order + 1 : 0;
    } else {
      // Insert between existing lists (targetPosition is 1-indexed)
      const prevList = otherLists[targetPosition - 2]; // Previous list
      const nextList = otherLists[targetPosition - 1]; // Next list
      if (prevList && nextList) {
        newOrder = (prevList.order + nextList.order) / 2;
      } else if (prevList) {
        newOrder = prevList.order + 1;
      } else if (nextList) {
        newOrder = nextList.order - 1;
      } else {
        newOrder = 0;
      }
    }

    // Update the list's order
    listToMove.order = newOrder;
  } else {
    // Moving to a different board
    // Update list's board reference
    listToMove.boardId = targetBoardId;

    // Calculate order for the new board
    // Filter out inbox, archived, and non-draggable lists to match UI
    const targetBoardLists = getBoardLists(state, targetBoardId);
    const visibleLists = targetBoardLists.filter(
      (list) => list.id !== 'inbox' && !list.archived && list.isDraggable !== false
    );

    let newOrder: number;
    if (targetPosition <= 1 || visibleLists.length === 0) {
      // Moving to first position
      const firstList = visibleLists[0];
      newOrder = firstList ? firstList.order - 1 : 0;
    } else if (targetPosition > visibleLists.length) {
      // Moving to last position
      const lastList = visibleLists[visibleLists.length - 1];
      newOrder = lastList ? lastList.order + 1 : 0;
    } else {
      // Insert between existing lists (targetPosition is 1-indexed)
      const prevList = visibleLists[targetPosition - 2]; // Previous list
      const nextList = visibleLists[targetPosition - 1]; // Next list
      if (prevList && nextList) {
        newOrder = (prevList.order + nextList.order) / 2;
      } else if (nextList) {
        newOrder = nextList.order - 1;
      } else {
        newOrder = 0;
      }
    }

    listToMove.order = newOrder;

    // Move all cards from this list to the target board
    for (const cardRef of listToMove.cardRefs) {
      const card = state.cards[cardRef.cardId];
      if (card) {
        card.boardId = targetBoardId;
      }
    }
  }
}

function moveAllCardsToList(
  state: TrelloStoreData,
  params: { sourceListId: string; targetListId: string }
) {
  const { sourceListId, targetListId } = params;

  // Get source and target lists
  const sourceList = state.lists[sourceListId];
  const targetList = state.lists[targetListId];

  if (!sourceList || !targetList) return;

  // Get all cards from source list
  const cardsToMove = [...sourceList.cardRefs]; // Create a copy

  if (cardsToMove.length === 0) return;

  // Add cards to target list (at the end)
  targetList.cardRefs.push(...cardsToMove);

  // Remove cards from source list
  sourceList.cardRefs = [];
}

function sortList(
  state: TrelloStoreData,
  params: {
    listId: string;
    sortBy: 'dateCreatedNewest' | 'dateCreatedOldest' | 'cardNameAlphabetical' | 'dueDate';
  }
) {
  const { listId, sortBy } = params;

  // Get the list
  const list = state.lists[listId];
  if (!list) return;

  // Get all cards in the list
  const cardsInList = list.cardRefs
    .map((ref) => state.cards[ref.cardId])
    .filter((card): card is Card => card != null);

  if (cardsInList.length <= 1) return; // No need to sort if 0 or 1 cards

  // Sort cards based on the sortBy parameter
  let sortedCards: typeof cardsInList;

  switch (sortBy) {
    case 'dateCreatedNewest':
      sortedCards = cardsInList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;

    case 'dateCreatedOldest':
      sortedCards = cardsInList.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;

    case 'cardNameAlphabetical':
      sortedCards = cardsInList.sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );
      break;
    case 'dueDate':
      sortedCards = sortCardsByDueDateOrder(cardsInList);
      break;

    default:
      return; // Unknown sort type
  }

  // Update the list's cardRefs with the new sorted order
  list.cardRefs = sortedCards.map((card) => ({
    type: 'card',
    cardId: card.id,
  }));
}

function toggleListWatch(state: TrelloStoreData, params: { listId: string }) {
  const { listId } = params;

  // Get the list
  const list = state.lists[listId];
  if (!list) return;

  // Toggle boolean watched state
  list.watched = !(list.watched === true);
}

function archiveList(state: TrelloStoreData, params: { listId: string }) {
  const { listId } = params;

  // Get the list
  const list = state.lists[listId];
  if (!list) return;

  // Archive the list
  list.archived = true;
  list.archivedAt = mockNow().toISO();

  // Get all cards in this list
  const cardsInList = list.cardRefs
    .map((ref) => state.cards[ref.cardId])
    .filter((card): card is Card => card != null);

  // Store the card IDs that were archived with this list
  list.archivedCardIds = list.cardRefs.map((ref) => ref.cardId);

  // Archive only cards that are not already archived; mark them as archived with this list
  cardsInList.forEach((card) => {
    if (!card.archived) {
      card.archived = true;
      card.archivedAt = mockNow().toISO();
      card.archivedWithList = listId; // Mark that this card was archived as part of a list
    }
  });

  // Clear the list's cardRefs since they're now archived
  list.cardRefs = [];
}

function unarchiveList(state: TrelloStoreData, params: { listId: string }) {
  const { listId } = params;

  // Get the list
  const list = state.lists[listId];
  if (!list) return;

  // Unarchive the list
  list.archived = false;
  list.archivedAt = undefined;

  // Restore all cards that were archived with this list
  if (list.archivedCardIds) {
    const cardsToRestore = list.archivedCardIds
      .map((cardId) => state.cards[cardId])
      .filter((card): card is Card => card != null && card.archivedWithList === listId);

    cardsToRestore.forEach((card) => {
      card.archived = false;
      card.archivedAt = undefined;
      card.archivedWithList = undefined;
    });

    // Restore the card refs to the list
    list.cardRefs = list.archivedCardIds.map((cardId) => ({
      type: 'card',
      cardId,
    }));
    list.archivedCardIds = undefined; // Clear the archived card IDs
  }
}

function deleteList(state: TrelloStoreData, params: { listId: string; deleteCards?: boolean }) {
  const { listId, deleteCards = true } = params;

  const list = state.lists[listId];
  if (!list) return;

  // Optionally delete all cards associated with this list
  if (deleteCards) {
    // For archived lists, cards are tracked in archivedCardIds; for active lists, use cardRefs
    const cardIds: string[] = [
      ...(list.archivedCardIds ?? []),
      ...list.cardRefs.map((ref) => ref.cardId),
    ];

    // Deduplicate just in case
    const uniqueCardIds = Array.from(new Set(cardIds));
    uniqueCardIds.forEach((cardId) => {
      if (state.cards[cardId]) {
        deleteCard(state, { cardId });
      }
    });
  }

  // Remove list from board collapsed state if present
  const board = state.boards[list.boardId];
  if (board) {
    board.collapsedListIds = board.collapsedListIds.filter((id) => id !== listId);
  }

  // Finally remove the list itself
  delete state.lists[listId];
}

function archiveAllCardsInList(state: TrelloStoreData, params: { listId: string }): string[] {
  const { listId } = params;

  // Get the list
  const list = state.lists[listId];
  if (!list) return [];

  // Get all cards in this list
  const cardsInList = list.cardRefs
    .map((ref) => state.cards[ref.cardId])
    .filter((card): card is Card => card != null && !card.archived);

  // Archive all cards in this list
  const archivedCardIds: string[] = [];
  cardsInList.forEach((card) => {
    card.archived = true;
    card.archivedAt = mockNow().toISO();
    archivedCardIds.push(card.id);
  });

  return archivedCardIds; // Return the IDs of cards that were archived
}

function unarchiveAllCardsInList(
  state: TrelloStoreData,
  params: { listId: string; cardIds: string[] }
) {
  const { listId, cardIds } = params;

  // Get the list
  const list = state.lists[listId];
  if (!list) return;

  // Unarchive the specified cards
  cardIds.forEach((cardId) => {
    const card = state.cards[cardId];
    if (card && card.archived) {
      card.archived = false;
      card.archivedAt = undefined;
    }
  });
}

// User Operations
function updateCurrentUser(
  state: TrelloStoreData,
  params: { updates: Partial<Omit<TrelloUser, 'id'>> }
) {
  const { updates } = params;
  Object.assign(state.currentUser, updates);
}

function assignUserToCard(state: TrelloStoreData, params: { cardId: string; userId: string }) {
  const { cardId, userId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');
  if (!state.users[userId]) throw new Error('User not found');

  let assignedTo = card.assignedTo || [];

  // When assigning a user to a card (teammate assignment), add them to assignedTo
  // This represents other team members being assigned to collaborate on the card
  if (!assignedTo.includes(userId)) {
    assignedTo = [...assignedTo, userId];
  }

  const updates: Partial<Card> = {
    assignedTo,
    updatedAt: mockNow().toISO(),
  };

  // If the user being assigned is the current user, also set joined and watched
  // This handles the case where the current user gets assigned by someone else
  if (userId === state.currentUser.id) {
    updates.joined = true;
    updates.watched = true;
  }

  // Apply assignment to card and all its mirrors
  updateCard(state, { cardId, updates });
}

function unassignUserFromCard(state: TrelloStoreData, params: { cardId: string; userId: string }) {
  const { cardId, userId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const assignedTo = card.assignedTo ? card.assignedTo.filter((id) => id !== userId) : [];

  // Apply unassignment to card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      assignedTo,
      updatedAt: mockNow().toISO(),
    },
  });
}

// Helper function to get the original card ID for comments
function getOriginalCardIdForComments(state: TrelloStoreData, cardId: string): string {
  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // If this is a mirror card, use the original card's ID for comments
  if (card.isMirror && card.mirrorOf) {
    return card.mirrorOf;
  }

  // Otherwise use the card's own ID
  return cardId;
}

// Comment Operations
function addComment(state: TrelloStoreData, params: { cardId: string; content: string }) {
  const { cardId, content } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Get the original card ID to associate comments with
  const originalCardId = getOriginalCardIdForComments(state, cardId);

  const newComment: Comment = {
    id: `comment-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`,
    cardId: originalCardId, // Always associate comments with the original card
    userId: state.currentUser.id,
    boardId: card.boardId, // Add boardId for normalized structure
    content,
    createdAt: mockNow().toISO(),
  };

  // Add comment to normalized comments collection
  state.comments[newComment.id] = newComment;

  // Add comment ID to the board's commentIds array
  const board = state.boards[card.boardId];
  if (board) {
    board.commentIds.push(newComment.id);
  }
  return newComment.id;
}

function updateComment(state: TrelloStoreData, params: { commentId: string; content: string }) {
  const { commentId, content } = params;

  // Find comment in normalized comments collection
  const comment = state.comments[commentId];
  if (!comment) throw new Error('Comment not found');

  // Only allow the comment author to update
  if (comment.userId !== state.currentUser.id) {
    throw new Error('Unauthorized to update this comment');
  }

  comment.content = content;
  comment.updatedAt = mockNow().toISO();
}

function deleteComment(state: TrelloStoreData, params: { commentId: string }) {
  const { commentId } = params;

  // Find comment in normalized comments collection
  const comment = state.comments[commentId];
  if (!comment) throw new Error('Comment not found');

  // Only allow the comment author to delete
  if (comment.userId !== state.currentUser.id) {
    throw new Error('Unauthorized to delete this comment');
  }

  // Remove comment from normalized collection
  delete state.comments[commentId];

  // Remove comment ID from board's commentIds array
  const board = state.boards[comment.boardId];
  if (board) {
    board.commentIds = board.commentIds.filter((id) => id !== commentId);
  }
}

// Activity Operations
function addActivity(
  state: TrelloStoreData,
  params: {
    cardId: string;
    type: Activity['type'];
    details?: Activity['details'];
  }
) {
  const { cardId, type, details = {} } = params;

  // Find the board that contains this card
  const card = state.cards[cardId];
  if (!card) return;

  const board = state.boards[card.boardId];
  if (!board) return;

  const activity: Activity = {
    id: `activity-${mockNow().valueOf()}-${Math.random().toString(36).substr(2, 9)}`,
    cardId,
    userId: state.currentUser.id,
    boardId: card.boardId, // Add boardId for normalized structure
    type,
    details,
    createdAt: mockNow().toISO(),
  };

  // Add activity to normalized activities collection
  state.activities[activity.id] = activity;

  // Add activity ID to board's activityIds array
  board.activityIds.push(activity.id);
}

// applyToCardAndMirrors is no longer needed - updateCard handles mirror updates

// Card Join Operations
function joinCard(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Prepare updates for joined status
  const updates: Partial<Card> = {
    joined: true,
    watched: true, // Joining also makes the card watched
  };

  // When the primary user (current user) joins a card, they should be shown in assignedTo
  // This represents the current user actively joining/participating in the card
  if (!card.assignedTo) {
    updates.assignedTo = [state.currentUser.id];
  } else if (!card.assignedTo.includes(state.currentUser.id)) {
    updates.assignedTo = [...card.assignedTo, state.currentUser.id];
  }

  // Apply updates to card and all its mirrors
  updateCard(state, { cardId, updates });

  // Log activity
  addActivity(state, {
    cardId,
    type: 'join',
    details: {},
  });
}

function leaveCard(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Prepare updates for leaving
  const updates: Partial<Card> = {
    joined: false,
    watched: false, // Leaving also unwatches the card
  };

  // When the primary user (current user) leaves a card, remove them from assignedTo
  // This represents the current user no longer participating in the card
  if (card.assignedTo) {
    updates.assignedTo = card.assignedTo.filter((userId) => userId !== state.currentUser.id);
  }

  // Apply updates to card and all its mirrors
  updateCard(state, { cardId, updates });

  // Log activity
  addActivity(state, {
    cardId,
    type: 'leave',
    details: {},
  });
}

function toggleCardWatch(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Prepare updates for watch toggle
  const updates: Partial<Card> = {
    watched: !card.watched,
  };

  // Apply updates to card and all its mirrors
  updateCard(state, { cardId, updates });
}

// Label Operations
function createLabel(state: TrelloStoreData, params: { title?: string; color: string }) {
  const { title, color } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return '';

  const newLabel: Label = {
    id: `label-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    color,
    createdAt: mockNow().toISO(),
    createdBy: state.currentUser.id,
    boardId: state.currentBoardId, // Add boardId for normalized structure
  };

  // Add label to normalized labels collection
  state.labels[newLabel.id] = newLabel;

  // Add label ID to board's labelIds array
  currentBoard.labelIds.push(newLabel.id);
  return newLabel.id;
}

function updateLabel(
  state: TrelloStoreData,
  params: {
    labelId: string;
    updates: Partial<Omit<Label, 'id' | 'createdAt' | 'createdBy'>>;
  }
) {
  const { labelId, updates } = params;

  // Find label in normalized labels collection
  const label = state.labels[labelId];
  if (!label) throw new Error('Label not found');

  Object.assign(label, updates);
}

function deleteLabel(state: TrelloStoreData, params: { labelId: string }) {
  const { labelId } = params;

  // Find label in normalized labels collection
  const label = state.labels[labelId];
  if (!label) throw new Error('Label not found');

  // Remove label from all cards on this board
  const boardCards = getBoardCards(state, label.boardId);
  for (const card of boardCards) {
    if (card.labelIds && card.labelIds.includes(labelId)) {
      updateCard(state, {
        cardId: card.id,
        updates: {
          labelIds: card.labelIds.filter((id) => id !== labelId),
        },
      });
    }
  }

  // Remove label from normalized collection
  delete state.labels[labelId];

  // Remove label ID from board's labelIds array
  const board = state.boards[label.boardId];
  if (board) {
    board.labelIds = board.labelIds.filter((id) => id !== labelId);
  }
}

function addLabelToCard(state: TrelloStoreData, params: { cardId: string; labelId: string }) {
  const { cardId, labelId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const currentBoard = state.boards[card.boardId];
  if (!currentBoard) throw new Error('Board not found');

  const label = state.labels[labelId];
  if (!label) throw new Error('Label not found');

  let labelIds = card.labelIds || [];

  if (!labelIds.includes(labelId)) {
    labelIds = [...labelIds, labelId];
  }

  // Apply label to card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      labelIds,
      updatedAt: mockNow().toISO(),
    },
  });
}

function removeLabelFromCard(state: TrelloStoreData, params: { cardId: string; labelId: string }) {
  const { cardId, labelId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const labelIds = card.labelIds ? card.labelIds.filter((id) => id !== labelId) : [];

  // Apply label removal to card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      labelIds,
      updatedAt: mockNow().toISO(),
    },
  });
}

// Checklist Operations
function clearAllChecklists(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) return;

  // Remove all checklists associated with this card
  if (card.checklistIds) {
    card.checklistIds.forEach((checklistId) => {
      delete state.checklists[checklistId];
    });
  }

  // Update card to remove checklist references
  updateCard(state, {
    cardId,
    updates: {
      checklistIds: undefined,
      updatedAt: mockNow().toISO(),
    },
  });
}

function copyChecklistFromCard(
  state: TrelloStoreData,
  params: {
    targetCardId: string;
    sourceCardId: string;
    checklistId?: string;
    titleOverride?: string;
  }
) {
  const { targetCardId, sourceCardId, checklistId, titleOverride } = params;

  const sourceCard = state.cards[sourceCardId];

  if (!sourceCard || !sourceCard.checklistIds || sourceCard.checklistIds.length === 0) {
    return;
  }

  // If checklistId is provided, copy only that specific checklist
  const checklistIdsToCopy = checklistId
    ? sourceCard.checklistIds.filter((id) => id === checklistId)
    : sourceCard.checklistIds; // Copy all if no specific checklistId provided

  if (checklistIdsToCopy.length === 0) {
    return; // No matching checklist found
  }

  // Copy each selected checklist
  const targetCard = state.cards[targetCardId];
  if (!targetCard) return;

  const targetChecklistIds = [...(targetCard.checklistIds || [])];

  for (const sourceChecklistId of checklistIdsToCopy) {
    const sourceChecklist = state.checklists[sourceChecklistId];
    if (sourceChecklist) {
      const newChecklistId = `checklist-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
      const newChecklist: Checklist = {
        id: newChecklistId,
        cardId: targetCardId,
        title:
          // When copying a specific checklist and a title override is provided, use it
          checklistId && titleOverride && titleOverride.trim()
            ? titleOverride.trim()
            : sourceChecklist.title,
        items: sourceChecklist.items.map((item) => ({
          ...item,
          checked: false, // Reset to unchecked
        })),
      };

      // Add to normalized collection
      state.checklists[newChecklistId] = newChecklist;
      targetChecklistIds.push(newChecklistId);
    }
  }

  // Update target card with new checklist IDs
  updateCard(state, {
    cardId: targetCardId,
    updates: {
      checklistIds: targetChecklistIds.length > 0 ? targetChecklistIds : undefined,
      updatedAt: mockNow().toISO(),
    },
  });

  // Log activity on the target card for auditability
  addActivity(state, {
    cardId: targetCardId,
    type: 'create',
    details: {},
  });
}
function addChecklistSection(
  state: TrelloStoreData,
  params: { cardId: string; title: string }
): string {
  const { cardId, title } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  const checklistId = `checklist-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Create new checklist in normalized collection
  const newChecklist: Checklist = {
    id: checklistId,
    cardId,
    title,
    items: [],
  };

  state.checklists[checklistId] = newChecklist;

  // Add checklist ID to card's checklistIds array
  const existingChecklistIds = card.checklistIds || [];
  updateCard(state, {
    cardId,
    updates: {
      checklistIds: [...existingChecklistIds, checklistId],
      updatedAt: mockNow().toISO(),
    },
  });

  return checklistId;
}

function updateChecklistTitle(
  state: TrelloStoreData,
  params: { cardId: string; checklistId: string; title: string }
) {
  const { cardId, checklistId, title } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist) return;

  // Update checklist title directly in normalized collection
  checklist.title = title;

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function removeChecklistSection(
  state: TrelloStoreData,
  params: { cardId: string; checklistId: string }
) {
  const { cardId, checklistId } = params;

  const card = state.cards[cardId];
  if (!card || !card.checklistIds) return;

  // Remove checklist from normalized collection
  delete state.checklists[checklistId];

  // Remove checklist ID from card's checklistIds array
  const updatedChecklistIds = card.checklistIds.filter((id) => id !== checklistId);

  updateCard(state, {
    cardId,
    updates: {
      checklistIds: updatedChecklistIds.length > 0 ? updatedChecklistIds : undefined,
      updatedAt: mockNow().toISO(),
    },
  });
}

function addItemToChecklistSection(
  state: TrelloStoreData,
  params: {
    cardId: string;
    checklistId: string;
    item: { label: string; checked?: boolean };
  }
) {
  const { cardId, checklistId, item } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist) return;

  // Add item directly to the checklist in normalized collection
  checklist.items.push({
    label: item.label,
    checked: item.checked ?? false,
  });

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function toggleItemInChecklistSection(
  state: TrelloStoreData,
  params: { cardId: string; checklistId: string; itemIndex: number }
) {
  const { cardId, checklistId, itemIndex } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Toggle the item directly in the normalized collection
  const currentItem = checklist.items[itemIndex]!;
  checklist.items[itemIndex] = {
    label: currentItem.label,
    checked: !currentItem.checked,
    assignedTo: currentItem.assignedTo,
    dueDate: currentItem.dueDate,
  };

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function updateItemInChecklistSection(
  state: TrelloStoreData,
  params: {
    cardId: string;
    checklistId: string;
    itemIndex: number;
    label: string;
  }
) {
  const { cardId, checklistId, itemIndex, label } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Update the item directly in the normalized collection
  const currentItem = checklist.items[itemIndex]!;
  checklist.items[itemIndex] = {
    label,
    checked: currentItem.checked,
    assignedTo: currentItem.assignedTo,
    dueDate: currentItem.dueDate,
  };

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function removeItemFromChecklistSection(
  state: TrelloStoreData,
  params: { cardId: string; checklistId: string; itemIndex: number }
) {
  const { cardId, checklistId, itemIndex } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Remove the item directly from the normalized collection
  checklist.items.splice(itemIndex, 1);

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function assignUserToChecklistItem(
  state: TrelloStoreData,
  params: {
    cardId: string;
    checklistId: string;
    itemIndex: number;
    userId: string;
  }
) {
  const { cardId, checklistId, itemIndex, userId } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Update the item directly in the normalized collection
  const currentItem = checklist.items[itemIndex]!;
  checklist.items[itemIndex] = {
    ...currentItem,
    assignedTo: userId,
  };

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function unassignUserFromChecklistItem(
  state: TrelloStoreData,
  params: {
    cardId: string;
    checklistId: string;
    itemIndex: number;
  }
) {
  const { cardId, checklistId, itemIndex } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Update the item directly in the normalized collection
  const currentItem = checklist.items[itemIndex]!;
  checklist.items[itemIndex] = {
    ...currentItem,
    assignedTo: undefined,
  };

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function setChecklistItemDueDate(
  state: TrelloStoreData,
  params: {
    cardId: string;
    checklistId: string;
    itemIndex: number;
    dueDate: string;
  }
) {
  const { cardId, checklistId, itemIndex, dueDate } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Update the item directly in the normalized collection
  const currentItem = checklist.items[itemIndex]!;
  checklist.items[itemIndex] = {
    ...currentItem,
    dueDate: dueDate,
  };

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

function removeChecklistItemDueDate(
  state: TrelloStoreData,
  params: {
    cardId: string;
    checklistId: string;
    itemIndex: number;
  }
) {
  const { cardId, checklistId, itemIndex } = params;

  // Find checklist in normalized collection
  const checklist = state.checklists[checklistId];
  if (!checklist || !checklist.items[itemIndex]) return;

  // Update the item directly in the normalized collection
  const currentItem = checklist.items[itemIndex]!;
  checklist.items[itemIndex] = {
    ...currentItem,
    dueDate: undefined,
  };

  // Update card's updatedAt timestamp
  updateCard(state, {
    cardId,
    updates: {
      updatedAt: mockNow().toISO(),
    },
  });
}

// UI: persist per-checklist hide completed items flag
function setChecklistHideCompleted(
  state: TrelloStoreData,
  params: { checklistId: string; hide: boolean }
) {
  const { checklistId, hide } = params;
  const checklist = state.checklists[checklistId];
  if (!checklist) return;
  checklist.hideCheckedItems = hide;
}

function toggleChecklistHideCompleted(state: TrelloStoreData, params: { checklistId: string }) {
  const { checklistId } = params;
  const checklist = state.checklists[checklistId];
  if (!checklist) return;
  checklist.hideCheckedItems = !(checklist.hideCheckedItems ?? false);
}

// Custom Field Definition Operations
function createCustomFieldDefinition(
  state: TrelloStoreData,
  params: {
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'list';
    options?: Array<{ label: string; color: string }>;
    showOnFront?: boolean;
  }
) {
  const { name, type, options, showOnFront } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return '';

  // Generate unique ID
  const fieldId = `custom-field-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Get next order from existing custom fields on this board
  const existingFieldIds = currentBoard.customFieldDefinitionIds;
  const existingOrders = existingFieldIds
    .map((id) => state.customFieldDefinitions[id]?.order ?? 0)
    .filter((order) => !isNaN(order));
  const nextOrder = Math.max(0, ...existingOrders) + 1;

  const newFieldDefinition = {
    id: fieldId,
    boardId: state.currentBoardId,
    name,
    type,
    options,
    showOnFront,
    createdAt: mockNow().toISO(),
    createdBy: state.currentUser.id,
    order: nextOrder,
  };

  // Add to normalized collection
  state.customFieldDefinitions[fieldId] = newFieldDefinition;

  // Add ID reference to board
  currentBoard.customFieldDefinitionIds.push(fieldId);

  // Automatically add this field to all cards on the board
  addCustomFieldToAllCards(state, { fieldId });

  return fieldId;
}

function createCustomFieldFromTemplate(state: TrelloStoreData, params: { templateId: string }) {
  const { templateId } = params;

  // Find the template
  const template = state.suggestedFieldTemplates.find((t) => t.id === templateId);
  if (!template) throw new Error('Suggested field template not found');

  // Create the custom field definition from template
  const fieldId = createCustomFieldDefinition(state, {
    name: template.name,
    type: template.type,
    options: template.options,
    showOnFront: template.showOnFront,
  });

  // Always add the field to all cards on the board
  addCustomFieldToAllCards(state, { fieldId });

  return fieldId;
}

function updateCustomFieldDefinition(
  state: TrelloStoreData,
  params: {
    fieldId: string;
    updates: Partial<Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'createdBy'>>;
  }
) {
  const { fieldId, updates } = params;

  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition) throw new Error('Custom field definition not found');

  // Verify it belongs to current board
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  // Apply updates
  Object.assign(fieldDefinition, updates);
}

function deleteCustomFieldDefinition(state: TrelloStoreData, params: { fieldId: string }) {
  const { fieldId } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  // Verify the field exists and belongs to current board
  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition) return;
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  // Remove from normalized collection
  delete state.customFieldDefinitions[fieldId];

  // Remove ID reference from board
  currentBoard.customFieldDefinitionIds = currentBoard.customFieldDefinitionIds.filter(
    (id) => id !== fieldId
  );

  // Remove from all cards in current board
  const boardCards = getBoardCards(state, state.currentBoardId);
  boardCards.forEach((card) => {
    if (card.customFields) {
      card.customFields = card.customFields.filter((field) => field.id !== fieldId);
    }
  });
}

function reorderCustomFieldDefinition(
  state: TrelloStoreData,
  params: { fieldId: string; direction: 'up' | 'down' }
) {
  const { fieldId, direction } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  // Get all custom field definitions for this board from normalized collection
  const fields = currentBoard.customFieldDefinitionIds
    .map((id) => state.customFieldDefinitions[id])
    .filter((f): f is CustomFieldDefinition => f != null)
    .sort((a, b) => a.order - b.order);

  const fieldIndex = fields.findIndex((f) => f.id === fieldId);

  if (fieldIndex === -1) throw new Error('Custom field definition not found');

  // Check if movement is possible
  if (direction === 'up' && fieldIndex === 0) return; // Already at top
  if (direction === 'down' && fieldIndex === fields.length - 1) return; // Already at bottom

  // Swap with adjacent field
  const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
  const currentField = fields[fieldIndex];
  const targetField = fields[targetIndex];

  if (!currentField || !targetField) throw new Error('Field not found for reordering');

  const tempOrder = currentField.order;
  currentField.order = targetField.order;
  targetField.order = tempOrder;
}

// Custom Field Definition Options Operations
function addCustomFieldOption(
  state: TrelloStoreData,
  params: { fieldId: string; option: string; color?: string }
) {
  const { fieldId, option, color } = params;

  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition) throw new Error('Custom field definition not found');

  // Verify it belongs to current board
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  // Initialize options array if it doesn't exist
  if (!fieldDefinition.options) {
    fieldDefinition.options = [];
  }

  // Default colors for dropdown options (same as ActiveFieldEditorModal)
  const defaultColors = [
    '#61BD4F', // Green
    '#F2D600', // Yellow
    '#FF9F1A', // Orange
    '#EB5A46', // Red
    '#C377E0', // Purple
    '#0079BF', // Blue
    '#00C2E0', // Light Blue
    '#51E898', // Light Green
    '#FF78CB', // Pink
    '#344563', // Dark Gray
  ];

  // Use provided color or default to no color (empty string)
  const optionColor: string = color ?? '';

  // Add the new option with color
  fieldDefinition.options.push({
    label: option,
    color: optionColor,
  });
}

function removeCustomFieldOption(
  state: TrelloStoreData,
  params: { fieldId: string; optionIndex: number }
) {
  const { fieldId, optionIndex } = params;

  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition || !fieldDefinition.options)
    throw new Error('Custom field definition or options not found');

  // Verify it belongs to current board
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  // Remove the option at the specified index
  if (optionIndex >= 0 && optionIndex < fieldDefinition.options.length) {
    fieldDefinition.options.splice(optionIndex, 1);
  }
}

function updateCustomFieldOption(
  state: TrelloStoreData,
  params: {
    fieldId: string;
    optionIndex: number;
    newOption: string;
    color?: string;
  }
) {
  const { fieldId, optionIndex, newOption, color } = params;

  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition || !fieldDefinition.options)
    throw new Error('Custom field definition or options not found');

  // Verify it belongs to current board
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  // Update the option at the specified index
  if (optionIndex >= 0 && optionIndex < fieldDefinition.options.length) {
    const currentOption = fieldDefinition.options[optionIndex];
    if (currentOption) {
      fieldDefinition.options[optionIndex] = {
        label: newOption,
        color: color ?? currentOption.color, // Keep existing color if not provided
      };
    }
  }
}

function reorderCustomFieldOption(
  state: TrelloStoreData,
  params: { fieldId: string; sourceIndex: number; destinationIndex: number }
) {
  const { fieldId, sourceIndex, destinationIndex } = params;

  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition || !fieldDefinition.options)
    throw new Error('Custom field definition or options not found');

  // Verify it belongs to current board
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  const options = fieldDefinition.options;

  // Validate indices
  if (
    sourceIndex < 0 ||
    sourceIndex >= options.length ||
    destinationIndex < 0 ||
    destinationIndex >= options.length
  ) {
    return; // Invalid indices, do nothing
  }

  // Remove the item from source index and insert at destination index
  const [movedOption] = options.splice(sourceIndex, 1);
  if (movedOption != null) {
    options.splice(destinationIndex, 0, movedOption);
  }
}

// Custom Field Card Operations
function addCustomFieldToAllCards(state: TrelloStoreData, params: { fieldId: string }) {
  const { fieldId } = params;

  // Get current board data
  const currentBoard = state.boards[state.currentBoardId];
  if (!currentBoard) return;

  // Verify field definition exists
  const fieldDefinition = state.customFieldDefinitions[fieldId];
  if (!fieldDefinition) throw new Error('Custom field definition not found');
  if (fieldDefinition.boardId !== state.currentBoardId) {
    throw new Error('Custom field definition does not belong to current board');
  }

  // Add the new custom field to every existing card in the current board so the field is visible everywhere
  const boardCards = getBoardCards(state, state.currentBoardId);
  boardCards.forEach((targetCard) => {
    // Initialize customFields array if needed
    if (!targetCard.customFields) {
      targetCard.customFields = [];
    }

    // Skip if the card already has this field
    const alreadyExists = targetCard.customFields.some((f) => f.id === fieldId);
    if (!alreadyExists) {
      targetCard.customFields.push({ id: fieldId, value: undefined });
      targetCard.updatedAt = mockNow().toISO();
    }
  });
}

function addCustomFieldToCard(state: TrelloStoreData, params: { cardId: string; fieldId: string }) {
  // Just delegate to addCustomFieldToAllCards since we always add to all cards
  addCustomFieldToAllCards(state, { fieldId: params.fieldId });
}

function removeCustomFieldFromCard(
  state: TrelloStoreData,
  params: { cardId: string; fieldId: string }
) {
  const { cardId, fieldId } = params;

  const card = state.cards[cardId];
  if (!card || !card.customFields) throw new Error('Card or custom fields not found');

  // Remove the custom field
  const updatedCustomFields = card.customFields.filter((field) => field.id !== fieldId);

  // Apply to card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      customFields: updatedCustomFields,
      updatedAt: mockNow().toISO(),
    },
  });
}

function updateCustomFieldValue(
  state: TrelloStoreData,
  params: { cardId: string; fieldId: string; value?: string }
) {
  const { cardId, fieldId, value } = params;

  const card = state.cards[cardId];
  if (!card || !card.customFields) throw new Error('Card or custom fields not found');

  // Update the custom field value
  const updatedCustomFields = card.customFields.map((field) =>
    field.id === fieldId ? { ...field, value } : field
  );

  // Apply to card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      customFields: updatedCustomFields,
      updatedAt: mockNow().toISO(),
    },
  });
}

// Maintenance Operations
function normalizeUrlMetadata(state: TrelloStoreData) {
  if (!shouldNormalizeTrelloUrlMetadata(state)) {
    return false;
  }

  normalizeTrelloUrlMetadata(state);
  return true;
}

function ensureInboxList(state: TrelloStoreData) {
  if (state.lists['inbox']) {
    return false;
  }

  ensureInboxListHelper(state);
  return true;
}

// Search Operations
function updateSearchQuery(state: TrelloStoreData, params: { query: string }) {
  const { query } = params;
  console.log('updateSearchQuery called with:', query);

  // Update search state
  state.search.query = query;

  // Check if query is valid using the enhanced validation
  const isValid = query.length >= 2 || (query.includes(':') && query.length >= 3);
  state.search.isActive = isValid;

  if (isValid) {
    // Parse the search query
    state.search.parsedQuery = parseSearchQuery(query);
    console.log('Parsed query:', state.search.parsedQuery);

    const results = executeSearch(state, state.search.parsedQuery);
    console.log('Search results:', results);
    state.search.results = results;
  } else {
    // Clear results if query is too short
    state.search.parsedQuery = undefined;
    state.search.results = {
      cards: [],
      lists: [],
      boards: [],
      totalCount: 0,
    };
  }
}

function clearSearch(state: TrelloStoreData) {
  state.search.query = '';
  state.search.isActive = false;
  state.search.parsedQuery = undefined;
  state.search.results = {
    cards: [],
    lists: [],
    boards: [],
    totalCount: 0,
  };
}

function addRecentSearch(state: TrelloStoreData, params: { query: string; resultCount: number }) {
  const { query, resultCount } = params;

  // Remove existing search with same query
  state.search.recentSearches = state.search.recentSearches.filter(
    (search) => search.query !== query
  );

  // Add new search at the beginning
  state.search.recentSearches.unshift({
    id: `search-${mockNow().valueOf()}`,
    query,
    timestamp: mockNow().toISO(),
    resultCount,
  });

  // Keep only last 10 searches
  state.search.recentSearches = state.search.recentSearches.slice(0, 10);
}

function removeRecentSearch(state: TrelloStoreData, params: { searchId: string }) {
  const { searchId } = params;
  state.search.recentSearches = state.search.recentSearches.filter(
    (search) => search.id !== searchId
  );
}

function addRecentBoard(state: TrelloStoreData, params: { boardId: string; title: string }) {
  const { boardId, title } = params;

  // Remove existing board with same ID
  state.search.recentBoards = state.search.recentBoards.filter((board) => board.id !== boardId);

  // Add new board at the beginning
  state.search.recentBoards.unshift({
    id: boardId,
    title,
    lastViewed: mockNow().toISO(),
    starred: false,
  });

  // Keep only last 5 boards
  state.search.recentBoards = state.search.recentBoards.slice(0, 5);
}

function setSearchActive(state: TrelloStoreData, params: { isActive: boolean }) {
  const { isActive } = params;
  state.search.isActive = isActive;
}

function ensureBoardFilterStateMap(state: TrelloStoreData): Record<string, BoardFilterOptions> {
  if (!state.boardFiltersByBoardId) {
    state.boardFiltersByBoardId = {};
  }
  return state.boardFiltersByBoardId;
}

function saveBoardFiltersFor(state: TrelloStoreData, boardId: string | null | undefined): void {
  if (!boardId) {
    return;
  }
  const map = ensureBoardFilterStateMap(state);
  map[boardId] = cloneBoardFilters(state.boardFilters);
}

function loadBoardFiltersForBoard(state: TrelloStoreData, boardId: string): void {
  const map = ensureBoardFilterStateMap(state);
  const stored = map[boardId];
  if (stored) {
    state.boardFilters = cloneBoardFilters(stored);
    return;
  }
  const defaults = createDefaultBoardFilters();
  state.boardFilters = defaults;
  map[boardId] = cloneBoardFilters(defaults);
}

// Board Filter Operations
function updateBoardFilters(state: TrelloStoreData, params: { filters: BoardFilterOptions }) {
  // Capture all current card IDs when filters are applied
  const allCardIds = Object.keys(state.cards);

  // Apply the filters with the snapshot
  state.boardFilters = {
    ...params.filters,
    filterSnapshotCardIds: allCardIds,
  };
  saveBoardFiltersFor(state, state.currentBoardId);
}

function clearBoardFilters(state: TrelloStoreData) {
  state.boardFilters = createDefaultBoardFilters();
  saveBoardFiltersFor(state, state.currentBoardId);
}

export const trelloStoreOperationDefinitions = {
  // Maintenance Operations
  normalizeUrlMetadata,
  ensureInboxList,

  // Search Operations
  updateSearchQuery,
  clearSearch,
  addRecentSearch,
  removeRecentSearch,
  addRecentBoard,
  setSearchActive,

  // Board Filter Operations
  updateBoardFilters,
  clearBoardFilters,

  // Board Operations
  createBoard,
  switchBoard,
  updateBoard,
  updateBoardTitle,
  toggleBoardStar,
  duplicateBoard,

  // Card Operations
  updateCard,
  moveCard,
  archiveCard,
  unarchiveCard,
  deleteCard,
  removeMirrorCard,
  reorderCards,
  sortCards,
  addCard,
  copyCard,
  mirrorCard,
  toggleCardCompletion,
  joinCard,
  leaveCard,
  toggleCardWatch,

  // List Operations
  addList,
  copyList,
  moveList,
  moveAllCardsToList,
  sortList,
  toggleListWatch,
  archiveList,
  unarchiveList,
  deleteList,
  archiveAllCardsInList,
  unarchiveAllCardsInList,
  updateListTitle,
  reorderLists,
  toggleListCollapse,
  collapseAllLists,
  expandAllLists,
  expandList,

  // Label Operations
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,

  // User Operations
  updateCurrentUser,
  assignUserToCard,
  unassignUserFromCard,

  // Comment Operations
  addComment,
  updateComment,
  deleteComment,

  // Activity Operations
  addActivity,

  // Checklist Operations
  addChecklistSection,
  updateChecklistTitle,
  removeChecklistSection,
  addItemToChecklistSection,
  toggleItemInChecklistSection,
  updateItemInChecklistSection,
  removeItemFromChecklistSection,
  clearAllChecklists,
  copyChecklistFromCard,
  assignUserToChecklistItem,
  unassignUserFromChecklistItem,
  setChecklistItemDueDate,
  removeChecklistItemDueDate,
  setChecklistHideCompleted,
  toggleChecklistHideCompleted,

  // Template Operations
  makeCardTemplate,
  removeCardTemplate,
  createCardFromTemplate,

  // Custom Field Operations
  createCustomFieldDefinition,
  createCustomFieldFromTemplate,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  reorderCustomFieldDefinition,
  addCustomFieldToAllCards,
  addCustomFieldToCard,
  removeCustomFieldFromCard,
  updateCustomFieldValue,

  // Custom Field Option Operations
  addCustomFieldOption,
  removeCustomFieldOption,
  updateCustomFieldOption,
  reorderCustomFieldOption,
} satisfies OperationDefinitions<TrelloStoreData>;

// Template Operations
function makeCardTemplate(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Apply template status to card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      isTemplate: true,
      completed: false,
    },
  });

  // Log activity
  addActivity(state, {
    cardId,
    type: 'template',
    details: {},
  });
}

function removeCardTemplate(state: TrelloStoreData, params: { cardId: string }) {
  const { cardId } = params;

  const card = state.cards[cardId];
  if (!card) throw new Error('Card not found');

  // Remove template status from card and all its mirrors
  updateCard(state, {
    cardId,
    updates: {
      isTemplate: false,
    },
  });

  // Log activity
  addActivity(state, {
    cardId,
    type: 'template',
    details: {},
  });
}

function createCardFromTemplate(
  state: TrelloStoreData,
  params: {
    templateCardId: string;
    targetListId: string;
    title?: string;
    keepChecklists?: boolean;
    keepLabels?: boolean;
    keepMembers?: boolean;
    keepAttachments?: boolean;
    keepComments?: boolean;
    keepCustomFields?: boolean;
  }
) {
  const {
    templateCardId,
    targetListId,
    title,
    keepChecklists = true,
    keepLabels = true,
    keepMembers = true,
    keepAttachments = true,
    keepComments = true,
    keepCustomFields = true,
  } = params;

  const templateCard = state.cards[templateCardId];
  if (!templateCard || !templateCard.isTemplate) {
    throw new Error('Template card not found');
  }

  const targetList = state.lists[targetListId];
  if (!targetList) throw new Error('Target list not found');

  // Get current board
  const currentBoard = state.boards[templateCard.boardId];
  if (!currentBoard) throw new Error('Board not found');

  // Create a new card ID
  const newCardId = `card-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;

  // Create custom fields array with all existing custom field definitions
  const preservedCustomFields = keepCustomFields
    ? (templateCard.customFields ?? templateCard.preservedCustomFields)
    : undefined;
  const customFieldDefinitions = currentBoard.customFieldDefinitionIds
    .map((id) => state.customFieldDefinitions[id])
    .filter((f): f is CustomFieldDefinition => f != null);
  const customFields = createCustomFieldsFromDefinitions(
    customFieldDefinitions,
    preservedCustomFields
  );

  // Create the new card based on the template, but remove template-specific properties
  const newCard: Card = {
    ...templateCard,
    id: newCardId,
    boardId: targetList.boardId,
    title: title ?? templateCard.title,
    isTemplate: false, // New card is not a template
    isMirror: false, // New card is not a mirror
    mirrorOf: undefined,
    mirroredBy: [],
    createdBy: state.currentUser.id,
    createdAt: mockNow().toISO(),
    updatedAt: mockNow().toISO(),
    // Conditionally copy based on keepX parameters
    labelIds: keepLabels ? [...(templateCard.labelIds ?? [])] : undefined,
    checklistIds: keepChecklists ? [] : undefined, // Will be populated after copying checklists
    attachments: keepAttachments ? [...(templateCard.attachments ?? [])] : undefined,
    assignedTo: keepMembers ? [...(templateCard.assignedTo || [])] : undefined,
    // Reset state that shouldn't be copied
    archived: false,
    archivedAt: undefined,
    completed: false,
    joined: false,
    // Copy watched state if keeping members (watch state is user-specific)
    watched: keepMembers ? templateCard.watched : false,
    // Override custom fields with all current field definitions
    customFields: customFields.length > 0 ? customFields : undefined,
    preservedCustomFields: undefined,
    preservedLabelIds: undefined,
    preservedMemberIds: undefined,
  };

  // Add the new card to the cards store
  state.cards[newCardId] = newCard;

  const targetBoardRecord = state.boards[targetList.boardId];
  if (targetBoardRecord) {
    if (targetList.id === 'inbox') {
      assignCardUrlMetadata(newCard, targetBoardRecord, { skipSequence: true });
    } else {
      assignCardUrlMetadata(newCard, targetBoardRecord, {
        forceSequence: true,
      });
    }
  }

  // Copy checklists if requested
  if (keepChecklists) {
    const copiedChecklistIds = copyCardChecklists(state, templateCard, newCardId, {
      resetChecked: false, // Keep original checked state
      removeAssignments: false, // Keep assignments
    });
    newCard.checklistIds = copiedChecklistIds.length > 0 ? copiedChecklistIds : undefined;
  }

  if (keepComments) {
    const templateComments = Object.values(state.comments).filter(
      (comment) => comment.cardId === templateCardId
    );

    for (const comment of templateComments) {
      const newCommentId = `comment-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
      const newComment: Comment = {
        id: newCommentId,
        cardId: newCardId,
        userId: comment.userId,
        boardId: currentBoard.id,
        content: comment.content,
        createdAt: mockNow().toISO(),
      };

      state.comments[newCommentId] = newComment;
      currentBoard.commentIds.push(newCommentId);
    }
  }

  // Add to the target list
  addCardToList(targetList, newCardId);

  // Log activity for the new card
  addActivity(state, {
    cardId: newCardId,
    type: 'create',
    details: {
      templateCardId,
    },
  });

  return newCardId;
}

function updateBoardTitle(state: TrelloStoreData, params: { title: string }) {
  const { title } = params;

  // Update current board title
  const currentBoard = state.boards[state.currentBoardId];
  if (currentBoard) {
    currentBoard.title = title;
    currentBoard.updatedAt = mockNow().toISO();
  }

  // Update recent boards
  const recentBoard = state.search.recentBoards.find((b) => b.id === state.currentBoardId);
  if (recentBoard) {
    recentBoard.title = title;
  }
}

function duplicateBoard(
  state: TrelloStoreData,
  params: {
    boardId: string;
    title: string;
    keepCards?: boolean;
    keepTemplateCards?: boolean;
  }
) {
  const { boardId, title, keepCards = false, keepTemplateCards = false } = params;

  const sourceBoard = state.boards[boardId];
  if (!sourceBoard) throw new Error('Source board not found');

  // Create new board ID
  const newBoardId = `board-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
  const { urlMetadata: _sourceUrlMetadata, ...boardWithoutUrlMetadata } = sourceBoard;

  // Create the new board (copy structure but reset certain fields)
  const newBoard: Board = {
    ...boardWithoutUrlMetadata,
    id: newBoardId,
    title,
    // Reset label references; we'll populate freshly below to avoid duplicates
    labelIds: [],
    customFieldDefinitionIds: [],
    commentIds: [], // Don't copy comments (as per requirement)
    activityIds: [], // Don't copy activities (as per requirement)
    starred: false, // Reset starred status
    createdAt: mockNow().toISO(),
    updatedAt: mockNow().toISO(),
    createdBy: state.currentUser.id,
  };

  ensureBoardUrlMetadata(newBoard);

  // Get source board lists
  const sourceBoardLists = getBoardLists(state, boardId);
  const sourceBoardCards = getBoardCards(state, boardId);

  const cardsToCopy =
    keepCards || keepTemplateCards
      ? sourceBoardCards.filter((sourceCard) => {
          if (sourceCard.archived) {
            return false;
          }
          const isTemplate = sourceCard.isTemplate === true;
          return keepCards || (keepTemplateCards && isTemplate);
        })
      : [];

  // Copy lists structure (excluding inbox list, but map inbox ID for cards)
  const listIdMap: Record<string, string> = {};
  let listOrder = 0;

  for (const sourceList of sourceBoardLists) {
    if (sourceList.id === 'inbox') {
      // Map inbox to inbox (keep the same ID for special handling)
      listIdMap[sourceList.id] = 'inbox';
      continue;
    }

    const newListId = `list-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
    listIdMap[sourceList.id] = newListId;

    const newList: List = {
      ...sourceList,
      id: newListId,
      boardId: newBoardId,
      cardRefs: [], // Will be populated if we're copying cards
      order: listOrder++,
    };

    state.lists[newListId] = newList;
  }

  // Don't create a new inbox list since the inbox is global and shared across all boards
  listIdMap['inbox'] = 'inbox';

  // Copy labels to the new board first and build a mapping from source -> new
  const labelIdMap: Record<string, string> = {};
  const uniqueLabelIds = Array.from(new Set(sourceBoard.labelIds));
  const sourceBoardLabels = uniqueLabelIds
    .map((labelId) => state.labels[labelId])
    .filter((label) => label != null);

  sourceBoardLabels.forEach((label) => {
    const newLabelId = `label-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
    const newLabel: Label = {
      ...label,
      id: newLabelId,
      boardId: newBoardId,
    };
    state.labels[newLabelId] = newLabel;
    newBoard.labelIds.push(newLabelId);
    // Map original label ID to new label ID for card remapping below
    labelIdMap[label.id] = newLabelId;
  });

  const customFieldIdMap: Record<string, string> = {};
  if (cardsToCopy.length > 0) {
    const sourceFieldDefinitions = sourceBoard.customFieldDefinitionIds
      .map((id) => state.customFieldDefinitions[id])
      .filter((f): f is CustomFieldDefinition => f != null);

    sourceFieldDefinitions.forEach((field) => {
      const newFieldId = `customfield-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
      customFieldIdMap[field.id] = newFieldId;
      const newFieldDefinition: CustomFieldDefinition = {
        ...field,
        id: newFieldId,
        boardId: newBoardId,
        createdBy: state.currentUser.id,
      };
      state.customFieldDefinitions[newFieldId] = newFieldDefinition;
      newBoard.customFieldDefinitionIds.push(newFieldId);
    });
  }

  // Copy cards and their references (including mirrors) based on options
  if (cardsToCopy.length > 0) {
    const cardIdMap: Record<string, string> = {}; // Map old card IDs to new card IDs
    const mapCustomFieldValues = (
      fields: CustomFieldValue[] | undefined
    ): CustomFieldValue[] | undefined => {
      if (!fields) {
        return undefined;
      }
      const mapped = fields
        .map((field) => {
          const mappedId = customFieldIdMap[field.id];
          if (!mappedId) {
            return undefined;
          }
          return {
            ...field,
            id: mappedId,
          };
        })
        .filter((field): field is CustomFieldValue => field != null);
      return mapped.length > 0 ? mapped : undefined;
    };

    // First pass:Copy all unique cards that should be copied
    for (const sourceCard of cardsToCopy) {
      const newCardId = `card-${mockNow().valueOf()}-${Math.random().toString(36).slice(2, 8)}`;
      cardIdMap[sourceCard.id] = newCardId;

      // Map label IDs from source board to new board
      const mappedLabelIdsForCard = (sourceCard.labelIds ?? [])
        .map((id) => labelIdMap[id])
        .filter((id): id is string => id != null);

      const { urlMetadata: _sourceCardUrlMetadata, ...cardWithoutUrlMetadata } = sourceCard;
      const newCard: Card = {
        ...cardWithoutUrlMetadata,
        id: newCardId,
        boardId: newBoardId,
        // Reset certain fields (no comments, no members)
        assignedTo: undefined,
        joined: false,
        watched: false,
        createdAt: mockNow().toISO(),
        updatedAt: mockNow().toISO(),
        createdBy: state.currentUser.id,
        customFields: mapCustomFieldValues(sourceCard.customFields),
        preservedCustomFields: mapCustomFieldValues(sourceCard.preservedCustomFields),
        labelIds: mappedLabelIdsForCard.length > 0 ? mappedLabelIdsForCard : undefined,
        // Copy checklists but reset them to unchecked
        checklistIds: [], // Will be populated below
      };

      state.cards[newCardId] = newCard;

      if (newCard.isMirror === true) {
        assignCardUrlMetadata(newCard, newBoard, { skipSequence: true });
      } else {
        assignCardUrlMetadata(newCard, newBoard, { forceSequence: true });
      }

      // Copy checklists
      const copiedChecklistIds = copyCardChecklists(state, sourceCard, newCardId, {
        resetChecked: false, // Keep checked state when copying board
        removeAssignments: true, // Remove member assignments
      });
      newCard.checklistIds = copiedChecklistIds.length > 0 ? copiedChecklistIds : undefined;
    }

    // Second pass: Copy cardRefs from source lists to target lists
    for (const sourceList of sourceBoardLists) {
      if (sourceList.id === 'inbox') continue; // Skip inbox list

      const targetListId = listIdMap[sourceList.id];
      if (!targetListId) continue; // Skip if list wasn't mapped

      const targetList = state.lists[targetListId];
      if (targetList) {
        for (const cardRef of sourceList.cardRefs) {
          const newCardId = cardIdMap[cardRef.cardId];

          // Only add cardRef if the card was copied
          if (newCardId) {
            // Copy card reference
            targetList.cardRefs.push({
              type: 'card',
              cardId: newCardId,
            });
          }
        }
      }
    }
  }

  // Labels already copied above; card label IDs have been remapped accordingly

  // Add the new board to the store
  state.boards[newBoardId] = newBoard;

  // Add to recent boards
  state.search.recentBoards.unshift({
    id: newBoardId,
    title: newBoard.title,
    lastViewed: mockNow().toISO(),
  });

  return newBoardId;
}
