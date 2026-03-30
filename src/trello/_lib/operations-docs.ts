export const trelloOperationsDocs = `
// Card Operations
function updateCard(cardId: string, updates: Partial<Omit<Card, "id" | "listId">>): void
// Updates a card with the provided fields. Can update title, description, labels, assignedTo, startDate, dueDate, etc.
// Example: updateCard("card-1", { title: "New Title", description: "Updated description", startDate: "2024-01-10T09:00:00.000Z", dueDate: "2024-01-15T17:00:00.000Z" })

function moveCard(cardId: string, targetListId: string, targetIndex?: number): void
// Moves a card to a different list. If targetIndex is provided, inserts at that position.
// Example: moveCard("card-1", "list-2", 0) // Move to top of list-2

function addCard(listId: string, title: string): string
// Creates a new card in the specified list and returns the new card ID.
// Example: const cardId = addCard("list-1", "New Task")

function copyCard(sourceCardId: string, targetListId: string, targetIndex: number, title: string, keepLabels?: boolean, keepComments?: boolean, keepMembers?: boolean, keepChecklists?: boolean, keepCustomFields?: boolean): string
// Creates a copy of an existing card in the target list. Returns the new card ID.
// Example: copyCard("card-1", "list-2", 0, "Copy of Card", true, false, true, true, true)

function mirrorCard(sourceCardId: string, targetListId: string, targetIndex: number): string
// Creates a linked mirror card as its own card record (with "isMirror" and "mirrorOf").
// Content is copied at creation time; comments are associated with the original and
// shown on mirrors. Returns the new mirror card ID.
// Example: mirrorCard("card-1", "list-2", 0)

function deleteCard(cardId: string): void
// Permanently deletes a card and all its data.
// Example: deleteCard("card-1")

function archiveCard(cardId: string): void
// Archives a card (soft delete - can be restored).
// Example: archiveCard("card-1")

function unarchiveCard(cardId: string): void
// Restores an archived card.
// Example: unarchiveCard("card-1")

function toggleCardCompletion(cardId: string): void
// Toggles the completion status of a card.
// Example: toggleCardCompletion("card-1")

// List Operations
function addList(title: string): string
// Creates a new list with the specified title and returns the list ID.
// Example: const listId = addList("To Do")

function updateListTitle(listId: string, title: string): void
// Updates the title of an existing list.
// Example: updateListTitle("list-1", "In Progress")

function reorderLists(sourceIndex: number, destinationIndex: number): void
// Reorders lists by moving from sourceIndex to destinationIndex.
// Example: reorderLists(0, 2) // Move first list to third position

// Board Operations
function updateBoardTitle(title: string): void
// Updates the board title.
// Example: updateBoardTitle("Project Board v2")

// Drag and Drop Operations
function reorderCards(listId: string, sourceIndex: number, destinationIndex: number): void
// Reorders cards within the same list.
// Example: reorderCards("list-1", 0, 2) // Move first card to third position

// Label Operations
function createLabel(title?: string, color: string): string
// Creates a new label with optional title and specified color. Returns label ID.
// Example: const labelId = createLabel("Priority", "red")

function updateLabel(labelId: string, updates: Partial<Omit<Label, "id" | "createdAt" | "createdBy">>): void
// Updates an existing label's properties.
// Example: updateLabel("label-1", { title: "High Priority", color: "orange" })

function deleteLabel(labelId: string): void
// Permanently deletes a label and removes it from all cards.
// Example: deleteLabel("label-1")

function addLabelToCard(cardId: string, labelId: string): void
// Adds a label to a card.
// Example: addLabelToCard("card-1", "label-1")

function removeLabelFromCard(cardId: string, labelId: string): void
// Removes a label from a card.
// Example: removeLabelFromCard("card-1", "label-1")

// Collapsed List Operations
function toggleListCollapse(listId: string): void
// Toggles the collapsed state of a list.
// Example: toggleListCollapse("list-1")

function expandList(listId: string): void
// Expands a collapsed list.
// Example: expandList("list-1")

// User Operations
function updateCurrentUser(updates: Partial<Omit<TrelloUser, "id">>): void
// Updates the current user's profile information.
// Example: updateCurrentUser({ displayName: "John Doe", avatar: "/new-avatar.jpg" })

function assignUserToCard(cardId: string, userId: string): void
// Assigns a user to a card (teammate assignment). If assigning the current user, they also join and watch the card.
// Example: assignUserToCard("card-1", "user-1")

function unassignUserFromCard(cardId: string, userId: string): void
// Removes a user assignment from a card.
// Example: unassignUserFromCard("card-1", "user-1")

// Comment Operations
function addComment(cardId: string, content: string): string
// Adds a comment to a card and returns the comment ID.
// Example: const commentId = addComment("card-1", "This needs review")

function updateComment(commentId: string, content: string): void
// Updates the content of an existing comment.
// Example: updateComment("comment-1", "Updated comment text")

function deleteComment(commentId: string): void
// Permanently deletes a comment.
// Example: deleteComment("comment-1")

// Activity Operations
function addActivity(cardId: string, type: string, description: string, metadata?: Record<string, any>): string
// Adds an activity log entry for a card. Returns activity ID.
// Example: addActivity("card-1", "label_added", "Added 'Priority' label", { labelId: "label-1" })

// Card Join Operations
function joinCard(cardId: string): void
// Adds the current user as a watcher/member of the card. The primary user joins the card and becomes assigned.
// Example: joinCard("card-1")

function leaveCard(cardId: string): void
// Removes the current user from watching/membership of the card. The primary user leaves the card and is unassigned.
// Example: leaveCard("card-1")

function toggleCardWatch(cardId: string): void
// Toggles the current user's watch status on a card.
// Example: toggleCardWatch("card-1")

// Checklist Operations
function addChecklistSection(cardId: string, title: string): string
// Adds a new checklist section to a card. Returns section ID.
// Example: const sectionId = addChecklistSection("card-1", "Requirements")

function updateChecklistTitle(cardId: string, checklistId: string, title: string): void
// Updates the title of an existing checklist section.
// Example: updateChecklistTitle("card-1", "checklist-1", "Updated Requirements")

function removeChecklistSection(cardId: string, sectionId: string): void
// Removes a checklist section and all its items.
// Example: removeChecklistSection("card-1", "section-1")

function addItemToChecklistSection(cardId: string, sectionId: string, label: string): string
// Adds a new item to a checklist section. Returns item ID.
// Example: const itemId = addItemToChecklistSection("card-1", "section-1", "Complete design")

function toggleItemInChecklistSection(cardId: string, sectionId: string, itemId: string): void
// Toggles the checked state of a checklist item.
// Example: toggleItemInChecklistSection("card-1", "section-1", "item-1")

function updateItemInChecklistSection(cardId: string, sectionId: string, itemId: string, label: string): void
// Updates the text of a checklist item.
// Example: updateItemInChecklistSection("card-1", "section-1", "item-1", "Complete final design")

function removeItemFromChecklistSection(cardId: string, sectionId: string, itemId: string): void
// Removes an item from a checklist section.
// Example: removeItemFromChecklistSection("card-1", "section-1", "item-1")

function clearAllChecklists(cardId: string): void
// Removes all checklist sections and items from a card.
// Example: clearAllChecklists("card-1")

function copyChecklistFromCard(sourceCardId: string, targetCardId: string, checklistId?: string): void
// Copies checklist sections and items from one card to another. If checklistId is provided, copies only that specific checklist.
// Example: copyChecklistFromCard("card-1", "card-2") // Copy all checklists
// Example: copyChecklistFromCard("card-1", "card-2", "checklist-1") // Copy specific checklist

// Usage Examples

// Creating a complete workflow:
const listId = addList("Sprint Backlog");
const cardId = addCard(listId, "Implement user authentication");
updateCard(cardId, { 
  description: "Add login/logout functionality with JWT tokens",
  startDate: "2024-01-10T09:00:00.000Z",
  dueDate: "2024-01-15T17:00:00.000Z"
});

const labelId = createLabel("Backend", "blue");
addLabelToCard(cardId, labelId);

const sectionId = addChecklistSection(cardId, "Implementation Tasks");
addItemToChecklistSection(cardId, sectionId, "Set up JWT middleware");
addItemToChecklistSection(cardId, sectionId, "Create login endpoint");
addItemToChecklistSection(cardId, sectionId, "Add password hashing");

assignUserToCard(cardId, "user-123");
addComment(cardId, "Started working on this feature");

// Moving and organizing:
moveCard(cardId, "in-progress-list", 0); // Move to top of in-progress
reorderCards("in-progress-list", 0, 2); // Reorder within list
`;
