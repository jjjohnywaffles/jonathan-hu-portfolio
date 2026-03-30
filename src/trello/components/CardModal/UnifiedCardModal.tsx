import React, { memo, useEffect, useCallback, useRef, useState } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { useModalClickOutside } from '../../hooks/use-modal-click-outside';
import { useCardModalState } from '../../hooks/use-card-modal-state';
import { useChecklistModals } from '../../hooks/use-checklist-modals';

import { getLabelColorClass } from '../../utils/label-colors';
import { IconAdd } from '../icons/card-modal/icon-add';
import { IconCheckmark } from '../icons/card/icon-checkmark';
import { IconTemplateModal } from '../icons/card/icon-template-modal';
import { Tooltip } from '../Tooltip';

import { IconLabel } from '../icons/card-modal/icon-label';
import { IconClock } from '../icons/card-modal/icon-clock';
import { IconChecklist } from '../icons/card-modal/icon-checklist';
import { IconMembers } from '../icons/card-modal/icon-members';
import { IconAttachment } from '../icons/card-modal/icon-attachment';
import { IconArchive } from '../icons/card-modal-action/icon-archive';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Text } from '../ui/Text';
import { FlexContainer } from '../ui/FlexContainer';
import { AddToCardButton } from '../ui/AddToCardButton';
import { UserAvatar } from '../ui/UserAvatar';
import { DueDateBadge, StartDateBadge } from '../ui/DateDisplay';
import { useNotifications } from '../NotificationContext';
import { isTextEditorActive } from '../../utils/text-editor-detection';
import { CardModalHeader } from './sections/CardModalHeader';
import { CardDescription } from './CardDescription';
import {
  ChecklistSection,
  AddChecklistModal,
  AssignChecklist,
  ChecklistItemAction,
} from './Checklist';
import { MoveCardModal } from './MoveCardModal';
import { CopyCardModal } from './CopyCardModal';
import { MirrorCardModal } from './MirrorCardModal';
import { LabelsModal } from './LabelsModal';
import { CreateLabelModal } from './CreateLabelModal';
import { AddToCardModal } from './AddToCardModal/';
import { CalendarModal } from './CalendarModal';
import { MembersModal } from './MembersModal';
import { CreateCardTemplateModal } from './CreateCardTemplateModal';
import { CustomFieldModal, CustomFieldsSection, ColorPickerModal } from './CustomField';
import { ActivityManager } from './ActivityManager';
import { CardTitle } from './CardTitle';
import { CardModalWidgets } from './CardModalWidgets';
import { TemplateCardBanner } from './TemplateCardBanner';
import { getLabelColorDisplayName } from '@trello/utils/label-colors';
import { mockNow } from '@trello/_lib/shims/time';
import { cn } from '@trello/_lib/shims/utils';
import {
  useCard,
  useCardList,
  useTrelloOperations,
  useCurrentUser,
  useCardLabels,
  useCardAssignedUsers,
  useCardCustomFields,
  useCustomFieldDefinition,
  useLabels,
  useChecklistItemForAction,
  useIsCardInInbox,
} from '@trello/_lib/selectors';
import type { ChecklistModalData } from '@trello/hooks/use-checklist-modals';
import { useTrelloStore } from '@trello/_lib';
import { pushPointerSuppression, popPointerSuppression } from '@trello/hooks/use-pointer-position';
import { useIsModifierEnabled } from '@trello/_lib/hooks/use-modifiers';

type UnifiedCardModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  // Customization props for different variants
  variant?: 'normal' | 'mirror';
  wrapper?: (children: React.ReactNode) => React.ReactNode;
  headerPrefix?: React.ReactNode;
  actionComponent?: React.ComponentType<any>;
  actionVariant?: 'normal' | 'inbox'; // Pass to action component
};

// Custom horizontal scrollbar for the card modal main content
const cardModalScrollbarStyles = `
  .card-modal-scroll { --scrollbar-size: 8px; position: relative; }
  .card-modal-scroll::-webkit-scrollbar { height: var(--scrollbar-size); }
  .card-modal-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.12); border-radius: 4px; margin: 0 6px; }
  .card-modal-scroll::-webkit-scrollbar-thumb { background: #6b7280; border-radius: 4px; }
  /* On hovering the draggable part (thumb), make it light gray */
  .card-modal-scroll:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
`;

// Wrapper component to handle color picker modal with proper data access

// Component to handle checklist item action modal
type ChecklistItemActionModalProps = {
  cardId: string;
  actionModalData: ChecklistModalData;
  onClose: () => void;
};

const ChecklistItemActionModal: FC<ChecklistItemActionModalProps> = memo(
  function ChecklistItemActionModal({ cardId, actionModalData, onClose }) {
    const itemData = useChecklistItemForAction(
      actionModalData.checklistId,
      actionModalData.itemIndex
    );

    if (!itemData) {
      return null;
    }

    return (
      <ChecklistItemAction
        cardId={cardId}
        checklistId={actionModalData.checklistId}
        itemIndex={actionModalData.itemIndex}
        itemLabel={itemData.item.label}
        assignedUserId={itemData.item.assignedTo}
        dueDate={itemData.item.dueDate}
        isChecked={itemData.item.checked}
        isOpen={true}
        onClose={onClose}
        buttonRef={actionModalData.buttonRef}
      />
    );
  }
);

const UnifiedCardModal: FC<UnifiedCardModalProps> = memo(function UnifiedCardModal({
  cardId,
  isOpen,
  onClose,
  variant = 'normal',
  wrapper = (children: React.ReactNode) => children,
  headerPrefix,
  actionComponent: ActionComponent,
  actionVariant = 'normal',
}) {
  // Use our custom hooks
  const modalState = useCardModalState(cardId);

  // Assignment modal state for checklist items
  const {
    assignModalData,
    dueDateModalData,
    actionModalData,
    handleOpenAssignModal,
    handleCloseAssignModal,
    handleOpenDueDateModal,
    handleCloseDueDateModal,
    handleOpenActionModal,
    handleCloseActionModal,
  } = useChecklistModals();

  // Data selectors
  const card = useCard(cardId);
  const currentList = useCardList(cardId);

  const {
    updateCard,
    toggleCardCompletion,
    toggleCardWatch,
    joinCard,
    leaveCard,
    archiveCard,
    unarchiveCard,
  } = useTrelloOperations();
  const { showNotification } = useNotifications();
  const currentUser = useCurrentUser();
  const assignedUsers = useCardAssignedUsers(cardId);
  const cardCustomFields = useCardCustomFields(cardId);
  const allLabels = useLabels();
  const isCardInInbox = useIsCardInInbox(cardId);
  const isTemplateCard = card?.isTemplate === true;
  const isOnlyHotkeys = useIsModifierEnabled('onlyHotkeys');

  // Close the modal immediately if this card becomes deleted
  useEffect(() => {
    if (!isOpen) return;
    if (card?.deleted === true) {
      onClose();
    }
  }, [isOpen, card?.deleted, onClose]);

  // Close the UnifiedCardModal when this card gets deleted
  const lastCardAction = useTrelloStore((state) => state.lastCardAction);
  useEffect(() => {
    if (!isOpen) return;
    if (lastCardAction?.action === 'delete' && lastCardAction.cardId === cardId) {
      onClose();
    }
  }, [lastCardAction, isOpen, cardId, onClose]);

  // For mirrored cards, get labels from the original card
  const originalCard = useCard(card?.mirrorOf ?? '');
  const effectiveCardForLabels = card?.isMirror && originalCard ? originalCard : card;
  const cardLabels = useCardLabels(effectiveCardForLabels?.id ?? cardId);

  // Look up the current editing label data
  const editingLabel = modalState.editingLabelId
    ? allLabels.find((label) => label.id === modalState.editingLabelId)
    : null;

  // Reset pending archive state when modal opens or card changes
  const wasOpenRef = useRef(isOpen);
  const prevCardIdRef = useRef(cardId);
  useEffect(() => {
    if ((isOpen && !wasOpenRef.current) || cardId !== prevCardIdRef.current) {
      // Modal is opening (was closed, now open) OR card changed
      modalState.setPendingArchiveTimestamp(null);
    }
    wasOpenRef.current = isOpen;
    prevCardIdRef.current = cardId;
  }, [isOpen, cardId, modalState]);

  // Handle close with pending archive logic (for normal cards only)
  const handleClose = () => {
    // Use setTimeout to allow any onBlur events (like title save) to complete first
    setTimeout(() => {
      if (variant === 'normal' && modalState.pendingArchiveTimestamp) {
        archiveCard({ cardId });
      }
      onClose();
    }, 0);
  };

  // Toggle sidebar visibility
  const handleToggleSidebar = () => {
    modalState.setIsSidebarVisible(!modalState.isSidebarVisible);
  };

  // Handle card completion toggle
  const handleToggleCompletion = () => {
    if (isTemplateCard) {
      return;
    }
    // Check if we're marking as complete (before the toggle)
    const isMarkingComplete = !card?.completed;

    toggleCardCompletion({ cardId });

    // Show notification if marking as complete in the inbox (which auto-archives)
    if (isMarkingComplete && isCardInInbox) {
      showNotification({
        type: 'archive',
        message: 'Card archived',
        onUndo: () => {
          unarchiveCard({ cardId });
          showNotification({
            type: 'unarchive',
            message: 'Unarchived card',
            duration: 3000,
          });
        },
      });
    }
  };

  // Handle watch toggle
  const handleToggleWatch = () => {
    toggleCardWatch({ cardId });
  };

  // Label modal handlers
  const handleOpenEditLabel = (labelId: string, buttonElement?: HTMLButtonElement) => {
    modalState.handleOpenEditLabelModal(labelId, buttonElement);
  };

  const handleCloseLabelsModal = () => {
    modalState.setIsLabelsModalOpen(false);
  };

  const handleOpenCreateLabelModal = (buttonRef?: React.RefObject<HTMLButtonElement | null>) => {
    modalState.handleOpenCreateLabelModal(buttonRef);
  };

  const handleBackFromCreateLabel = () => {
    modalState.handleBackFromCreateLabel();
  };

  // Use the modal click outside hook
  useModalClickOutside({
    isOpen,
    onClose: handleClose,
    modalRef: modalState.modalRef,
    bottomNavRef: modalState.bottomNavRef,
    childModals: [
      { isOpen: modalState.isLabelsModalOpen },
      { isOpen: modalState.isCreateLabelModalOpen },
      { isOpen: modalState.isChecklistModalOpen },
      { isOpen: modalState.isAddToCardModalOpen },
      { isOpen: modalState.isCalendarModalOpen },
      { isOpen: modalState.isMembersModalOpen },
      { isOpen: modalState.isCustomFieldModalOpen },
      { isOpen: modalState.isCustomFieldCalendarModalOpen },
      // inline color picker handled inside CustomFieldModal
      { isOpen: modalState.isCreateTemplateModalOpen },
      { isOpen: assignModalData !== null },
      { isOpen: dueDateModalData !== null },
      { isOpen: actionModalData !== null },
    ],
    siblingModals: [
      {
        isOpen: modalState.isMoveModalOpen,
        wasOpenRef: modalState.wasMoveModalOpenRef,
      },
      {
        isOpen: modalState.isActionModalOpen,
        wasOpenRef: modalState.wasActionModalOpenRef,
      },
      {
        isOpen: modalState.isCopyModalOpen,
        wasOpenRef: modalState.wasCopyModalOpenRef,
      },
      {
        isOpen: modalState.isMirrorModalOpen,
        wasOpenRef: modalState.wasMirrorModalOpenRef,
      },
    ],
    onCleanup: () => {
      document.body.style.overflow = '';
      modalState.wasMoveModalOpenRef.current = false;
      modalState.wasCopyModalOpenRef.current = false;
      modalState.wasMirrorModalOpenRef.current = false;
    },
  });

  // Set body overflow when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }, [isOpen]);

  // Suppress global pointer tracking while modal is open
  useEffect(() => {
    if (isOpen) {
      pushPointerSuppression();
    } else {
      popPointerSuppression();
    }
    return () => {
      if (isOpen) {
        popPointerSuppression();
      }
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or editors
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isTextEditorActive()
      ) {
        return;
      }

      // 'l' key to open labels via Add button variant
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modalState.handleOpenLabelsModalFromAddButton();
      }

      // 'd' key to open dates via Add button variant
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modalState.handleOpenCalendarModalFromAddButton();
      }

      // '-' key to open checklist via Add button variant
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modalState.handleOpenChecklistModalFromAddButton();
      }

      // 'm' key to open members via Add button variant
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modalState.handleOpenMembersModalFromAddButton();
      }

      // 'c' key to archive card from within the modal
      // Ignore when user is using copy shortcuts (Ctrl/Cmd + C)
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        if (!card) return;
        e.preventDefault();
        if (!card.archived) {
          // Archive card (works for both regular and mirror cards)
          archiveCard({ cardId });
          const isMirror = variant === 'mirror' || card.isMirror;
          showNotification({
            type: 'archive',
            message: isMirror ? 'Mirror card archived' : 'Card archived',
            onUndo: () => {
              unarchiveCard({ cardId });
              showNotification({
                type: 'unarchive',
                message: isMirror ? 'Mirror card unarchived' : 'Unarchived card',
                duration: 3000,
              });
            },
          });
        }
      }

      // 's' key to toggle watch status from within the modal
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
        if (!card) return;
        e.preventDefault();
        toggleCardWatch({ cardId });
      }

      // 'space' to join/leave from within the modal
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
        if (!card) return;
        e.preventDefault();
        if (card.joined === true) {
          leaveCard({ cardId });
        } else {
          joinCard({ cardId });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isOpen,
    modalState,
    card,
    cardId,
    currentList?.id,
    archiveCard,
    unarchiveCard,
    joinCard,
    leaveCard,
    toggleCardWatch,
    showNotification,
    variant,
  ]);

  if (!isOpen || !card) return null;

  // Shared classes for consistent styling
  const iconSmallClass = 'h-4 w-4';

  const content = (
    <div
      ref={modalState.modalRef}
      data-testid={variant === 'mirror' ? 'mirror-card-modal' : 'card-modal'}
      className={`flex h-[600px] max-h-[calc(100vh-8rem)] transform flex-col overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-300 ease-in-out ${
        modalState.isSidebarVisible
          ? 'w-[min(700px,calc(100vw-2rem))] md:w-[min(1100px,calc(100vw-2rem))]'
          : 'w-[min(700px,calc(100vw-2rem))]'
      }`}
      style={{
        ['--card-title-ideal-width' as any]: modalState.isSidebarVisible
          ? '672px' // 1100 - sidebar 380 - paddings 48
          : '652px', // 700 - paddings 48
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: cardModalScrollbarStyles }} />
      {/* Header */}
      <CardModalHeader
        card={card}
        currentList={currentList ?? undefined}
        onClose={handleClose}
        showMoveButton={variant === 'normal' || currentList?.id !== 'inbox'}
        moveButtonRef={modalState.moveButtonRef as React.RefObject<HTMLButtonElement>}
        onOpenMoveModal={modalState.handleOpenMoveModal}
        actionButtonRef={modalState.actionButtonRef as React.RefObject<HTMLButtonElement>}
        onOpenActionModal={modalState.handleOpenActionModal}
        onToggleWatch={handleToggleWatch}
      />

      {/* Header Prefix (e.g., mirror card notice) */}
      {headerPrefix}

      {/* Template Card Banner */}
      {card.isTemplate && (
        <>
          <TemplateCardBanner
            cardId={cardId}
            onClose={handleClose}
            createTemplateButtonRef={modalState.createTemplateButtonRef}
            onOpenCreateTemplateModal={modalState.handleOpenCreateTemplateModal}
          />
          <div className="border-b border-gray-200" />
        </>
      )}

      {/* Archive Status Bar */}
      {variant === 'normal' &&
        ((card?.archived && card?.archivedAt) || modalState.pendingArchiveTimestamp) && (
          <div className="flex-shrink-0 bg-gray-200 px-6 py-4">
            <FlexContainer direction="row" gap="3" justify="center">
              <IconArchive className="h-5 w-5 flex-shrink-0 text-gray-600" />
              <Text size="md" className="font-medium text-gray-700">
                Archived on{' '}
                {(() => {
                  const timestamp = modalState.pendingArchiveTimestamp || card?.archivedAt;
                  if (!timestamp) return '';
                  const dt = DateTime.fromISO(timestamp);
                  return dt.toFormat('LLL d, yyyy, h:mm a');
                })()}
              </Text>
            </FlexContainer>
          </div>
        )}

      <div className="flex min-h-0 flex-1">
        {/* Main Content - hidden only on very small screens when sidebar is visible */}
        <main
          className={`${modalState.isSidebarVisible ? 'min-w-0 flex-1 min-[500px]:block' : 'w-full'} ${modalState.isSidebarVisible ? 'hidden' : 'block'} card-modal-scroll relative overflow-x-auto overflow-y-auto p-6`}
          data-auto-scrollable="true"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #e5e7eb',
          }}
        >
          <div
            className="min-h-full max-w-full"
            style={{
              minWidth: modalState.isSidebarVisible
                ? 'var(--card-title-ideal-width, 652px)'
                : 'auto',
            }}
          >
            {/* Card Header */}
            <section className="mb-6">
              <div className="flex items-start gap-3">
                {/* Completion Button - aligned with first line of title */}
                {isTemplateCard ? (
                  <div className="relative mt-3 flex h-4 w-4 flex-none shrink-0 items-center justify-center">
                    <IconTemplateModal className="absolute h-6 w-6 text-gray-900" />
                  </div>
                ) : (
                  <Tooltip
                    content={card.completed ? 'Mark incomplete' : 'Mark complete'}
                    position="top"
                    variant="dark"
                  >
                    <button
                      className="mt-3 flex h-4 w-4 flex-none shrink-0 items-center justify-center self-start rounded-full border-2 border-gray-300 transition-colors hover:border-gray-400"
                      onClick={handleToggleCompletion}
                      style={{
                        backgroundColor: card.completed ? '#22c55e' : 'transparent',
                        borderColor: card.completed ? '#22c55e' : '#d1d5db',
                        color: card.completed ? 'white' : 'transparent',
                      }}
                    >
                      {card.completed && <IconCheckmark className="h-3 w-3" />}
                    </button>
                  </Tooltip>
                )}

                {/* Title */}
                <div className="flex-1">
                  <CardTitle
                    cardId={cardId}
                    title={card.title}
                    allowWrapping={!modalState.isSidebarVisible}
                  />
                </div>
              </div>
            </section>

            {/* Add to Card Section */}
            <section className="mb-6">
              <FlexContainer direction="row" gap="2" className="mb-4 ml-7">
                <AddToCardButton
                  icon={IconAdd}
                  label="Add"
                  onClick={modalState.handleOpenAddToCardModal}
                  buttonRef={modalState.addButtonRef}
                />
                {!isCardInInbox && !(cardLabels && cardLabels.length > 0) && (
                  <Tooltip content="Open labels" shortcut="l" position="bottom" variant="dark">
                    <AddToCardButton
                      icon={IconLabel}
                      label="Labels"
                      onClick={modalState.handleOpenLabelsModalFromElsewhere}
                      buttonRef={modalState.labelsButtonRef}
                      disabled={isOnlyHotkeys}
                    />
                  </Tooltip>
                )}
                {!card?.dueDate && !card?.startDate && !card?.isTemplate && (
                  <Tooltip content="Open dates" shortcut="d" position="bottom" variant="dark">
                    <AddToCardButton
                      icon={IconClock}
                      label="Dates"
                      onClick={modalState.handleOpenCalendarModalFromElsewhere}
                      buttonRef={modalState.calendarButtonRef}
                      disabled={isOnlyHotkeys}
                    />
                  </Tooltip>
                )}
                <Tooltip content="Create checklist" shortcut="-" position="bottom" variant="dark">
                  <AddToCardButton
                    icon={IconChecklist}
                    label="Checklist"
                    onClick={modalState.handleOpenChecklistModalFromElsewhere}
                    buttonRef={modalState.checklistButtonRef}
                    disabled={isOnlyHotkeys}
                  />
                </Tooltip>
                {!isCardInInbox && (
                  <Tooltip content="Open members" shortcut="m" position="bottom" variant="dark">
                    <AddToCardButton
                      icon={IconMembers}
                      label="Members"
                      onClick={modalState.handleOpenMembersModalFromElsewhere}
                      buttonRef={modalState.membersButtonRef}
                      show={assignedUsers.length === 0}
                      disabled={isOnlyHotkeys}
                    />
                  </Tooltip>
                )}
                {/* Temporarily disabled attachments button
                <AddToCardButton
                  icon={IconAttachment}
                  label="Attachment"
                  show={Boolean(card?.isTemplate || (cardLabels && cardLabels.length > 0) || card?.dueDate || card?.startDate || (assignedUsers && assignedUsers.length > 0))}
                />
                */}
              </FlexContainer>
            </section>

            {/* Members and Labels Section - show if user has joined OR labels exist OR due date or start date exists OR any members are assigned */}
            {(card?.joined ||
              (cardLabels && cardLabels.length > 0) ||
              card?.dueDate ||
              card?.startDate ||
              assignedUsers.length > 0) && (
              <section className="px-6 py-4">
                <div className="flex min-w-0 flex-wrap items-start gap-6">
                  {/* Members Section - show if any members are assigned (but not for inbox cards) */}
                  {!isCardInInbox && assignedUsers.length > 0 && (
                    <div className="flex-shrink-0">
                      <Text
                        variant="label"
                        size="sm"
                        className="mb-3 block text-gray-800 normal-case"
                      >
                        Members
                      </Text>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Show all assigned members */}
                        {assignedUsers.map((user) => (
                          <UserAvatar key={user.id} user={user} />
                        ))}
                        {/* Add member button */}
                        <IconButton
                          ref={modalState.membersGadgetButtonRef}
                          variant="ghost"
                          size="sm"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                          onClick={modalState.handleOpenMembersModalFromElsewhere}
                        >
                          <svg
                            className={iconSmallClass}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </IconButton>
                      </div>
                    </div>
                  )}

                  {/* Labels Section - show if labels exist (but not for inbox cards) */}
                  {!isCardInInbox && cardLabels && cardLabels.length > 0 && (
                    <div className="min-w-0 flex-shrink-0">
                      <div ref={modalState.labelsTitleRef}>
                        <Text
                          variant="label"
                          size="sm"
                          className="mb-3 block text-gray-800 normal-case"
                        >
                          Labels
                        </Text>
                      </div>
                      <div
                        ref={modalState.labelsContainerRef}
                        className="flex max-w-2xl flex-wrap items-center gap-2"
                        data-testid="card-back-labels-container"
                      >
                        {cardLabels.map((label) => {
                          const trimmedTitle = label.title?.trim() ?? '';
                          const colorName = getLabelColorDisplayName(label.color);
                          const tooltipText = `Color: ${colorName}, title: "${
                            trimmedTitle || 'none'
                          }"`;

                          return (
                            <Tooltip
                              key={label.id}
                              content={tooltipText}
                              position="bottom"
                              variant="dark"
                              delay={0}
                            >
                              <button
                                className={`flex h-8 max-w-full items-center overflow-hidden rounded-sm px-6 text-left text-sm font-medium transition-opacity hover:opacity-80 ${getLabelColorClass(label.color)} ${
                                  label.color.endsWith('_dark') ? 'text-white' : 'text-black'
                                }`}
                                style={{ lineHeight: '32px' }}
                                aria-label={tooltipText}
                                data-color={label.color}
                                data-testid="card-label"
                                onClick={modalState.handleOpenLabelsModalFromElsewhere}
                              >
                                <span
                                  className="overflow-hidden whitespace-nowrap"
                                  style={{ textOverflow: 'clip' }}
                                >
                                  {trimmedTitle}
                                </span>
                              </button>
                            </Tooltip>
                          );
                        })}
                        <Tooltip
                          content="Open labels"
                          shortcut="l"
                          position="bottom"
                          variant="dark"
                        >
                          <IconButton
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-sm bg-gray-200 text-gray-600 hover:bg-gray-300',
                              isOnlyHotkeys && 'matrices-disabled'
                            )}
                            type="button"
                            aria-label="Add a label"
                            onClick={
                              isOnlyHotkeys
                                ? undefined
                                : modalState.handleOpenLabelsModalFromElsewhere
                            }
                          >
                            <IconAdd className={iconSmallClass} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  {/* Date Section - show if due date or start date exists */}
                  {(card?.dueDate || card?.startDate) && (
                    <div className="flex-shrink-0">
                      <Text
                        variant="label"
                        size="sm"
                        className="mb-3 block text-gray-800 normal-case"
                      >
                        {card?.dueDate ? 'Due Date' : 'Start date'}
                      </Text>
                      {card?.dueDate ? (
                        <DueDateBadge
                          ref={modalState.dueDateBadgeRef}
                          dueDate={card.dueDate}
                          startDate={card.startDate}
                          isCompleted={card.completed}
                          onClick={modalState.handleOpenCalendarModalFromElsewhere}
                        />
                      ) : card?.startDate ? (
                        <StartDateBadge
                          ref={modalState.dueDateBadgeRef}
                          startDate={card.startDate}
                          onClick={modalState.handleOpenCalendarModalFromElsewhere}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Description Section */}
            <CardDescription card={card} />

            {/* Checklist Section */}
            <ChecklistSection
              cardId={cardId}
              onOpenAssignModal={handleOpenAssignModal}
              assignModalData={assignModalData}
              onOpenDueDateModal={handleOpenDueDateModal}
              dueDateModalData={dueDateModalData}
              onOpenActionModal={handleOpenActionModal}
              actionModalData={actionModalData}
            />

            {/* Custom Fields Section - hide for inbox cards */}
            {!isCardInInbox && (
              <CustomFieldsSection
                cardId={cardId}
                onOpenCustomFieldModal={modalState.handleOpenCustomFieldModal}
                editButtonRef={modalState.customFieldEditButtonRef}
                onOpenCalendarModal={modalState.handleOpenCustomFieldCalendarModal}
              />
            )}
          </div>
        </main>

        {/* Sidebar - full width on very small screens, fixed width on larger screens */}
        {modalState.isSidebarVisible && (
          <aside className="flex w-full flex-none flex-col border-l border-gray-200 bg-gray-50 max-[499px]:border-0 min-[500px]:w-[380px] min-[500px]:border-l">
            <ActivityManager
              cardId={cardId}
              showDetails={modalState.showDetails}
              onToggleDetails={() => modalState.setShowDetails(!modalState.showDetails)}
            />
          </aside>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden pt-12 transition-opacity"
      style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}
    >
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col items-center overflow-hidden">
        {/* Apply wrapper (for mirror card blue border) */}
        {wrapper(content)}

        {/* Widget Navigation - Outside modal */}
        <CardModalWidgets
          isSidebarVisible={modalState.isSidebarVisible}
          onToggleSidebar={handleToggleSidebar}
          bottomNavRef={modalState.bottomNavRef}
        />

        {/* Action Modal */}
        {ActionComponent && (
          <ActionComponent
            cardId={cardId}
            isOpen={modalState.isActionModalOpen}
            onClose={() => modalState.setIsActionModalOpen(false)}
            buttonRef={modalState.actionButtonRef as React.RefObject<HTMLButtonElement>}
            onOpenMoveModal={modalState.handleOpenMoveModal}
            onOpenCopyModal={modalState.handleOpenCopyModal}
            onOpenMirrorModal={modalState.handleOpenMirrorModal}
            onSetPendingArchive={() => modalState.setPendingArchiveTimestamp(mockNow().toISO())}
            onClearPendingArchive={() => modalState.setPendingArchiveTimestamp(null)}
            pendingArchiveTimestamp={modalState.pendingArchiveTimestamp}
            variant={actionVariant}
          />
        )}

        {/* Move Card Modal */}
        <MoveCardModal
          cardId={cardId}
          isOpen={modalState.isMoveModalOpen}
          onClose={() => modalState.setIsMoveModalOpen(false)}
          buttonRef={modalState.moveModalTriggerRef}
          onBack={
            modalState.moveModalOpenedFromActionModal
              ? () => {
                  modalState.setIsMoveModalOpen(false);
                  modalState.setIsActionModalOpen(true);
                }
              : undefined
          }
        />

        {/* Copy Card Modal */}
        <CopyCardModal
          cardId={cardId}
          isOpen={modalState.isCopyModalOpen}
          onClose={() => modalState.setIsCopyModalOpen(false)}
          buttonRef={modalState.copyModalTriggerRef}
          onBack={() => {
            modalState.setIsCopyModalOpen(false);
            modalState.setIsActionModalOpen(true);
          }}
        />

        {/* Mirror Card Modal */}
        <MirrorCardModal
          cardId={cardId}
          isOpen={modalState.isMirrorModalOpen}
          onClose={() => modalState.setIsMirrorModalOpen(false)}
          buttonRef={modalState.mirrorModalTriggerRef}
          onBack={() => {
            modalState.setIsMirrorModalOpen(false);
            modalState.setIsActionModalOpen(true);
          }}
        />

        {/* Labels Modal */}
        <LabelsModal
          cardId={effectiveCardForLabels?.id ?? cardId}
          isOpen={modalState.isLabelsModalOpen}
          onClose={handleCloseLabelsModal}
          onBack={
            modalState.labelsModalOpenedFromAddButton
              ? () => {
                  modalState.setIsLabelsModalOpen(false);
                  modalState.setIsAddToCardModalOpen(true);
                }
              : undefined
          }
          buttonRef={
            modalState.labelsModalOpenedFromAddButton
              ? (modalState.addButtonRef as React.RefObject<HTMLElement>)
              : cardLabels && cardLabels.length > 0
                ? modalState.labelsTitleRef.current
                  ? (modalState.labelsTitleRef as React.RefObject<HTMLElement>)
                  : modalState.labelsContainerRef
                : modalState.labelsButtonRef
          }
          modalRef={modalState.labelsModalRef}
          isCreateLabelModalOpen={modalState.isCreateLabelModalOpen}
          onOpenCreateLabel={handleOpenCreateLabelModal}
          onOpenEditLabel={handleOpenEditLabel}
        />

        {/* Create Label Modal */}
        <CreateLabelModal
          cardId={effectiveCardForLabels?.id ?? cardId}
          isOpen={modalState.isCreateLabelModalOpen}
          onClose={modalState.handleCloseCreateLabelModal}
          modalRef={modalState.createLabelModalRef}
          buttonRef={modalState.createLabelButtonRef}
          onBack={handleBackFromCreateLabel}
          editLabelId={modalState.editingLabelId}
          initialTitle={editingLabel?.title || ''}
          initialColor={editingLabel?.color || 'lime'}
          labelsModalRef={modalState.labelsModalRef}
          labelsModalPosition={modalState.labelsModalPositionRef.current}
        />

        {/* Custom Fields Modal */}
        <CustomFieldModal
          cardId={cardId}
          isOpen={modalState.isCustomFieldModalOpen}
          onClose={() => modalState.setIsCustomFieldModalOpen(false)}
          onBack={
            modalState.customFieldModalOpenedFromAddButton
              ? () => {
                  modalState.setIsCustomFieldModalOpen(false);
                  modalState.setIsAddToCardModalOpen(true);
                }
              : undefined
          }
          buttonRef={
            modalState.customFieldModalOpenedFromAddButton
              ? (modalState.addButtonRef as React.RefObject<HTMLElement>)
              : cardCustomFields && cardCustomFields.length > 0
                ? modalState.customFieldEditButtonRef
                : modalState.addButtonRef
          }
          modalRef={modalState.customFieldModalRef}
        />

        {/* Add Checklist Modal */}
        <AddChecklistModal
          cardId={cardId}
          isOpen={modalState.isChecklistModalOpen}
          onClose={() => modalState.setIsChecklistModalOpen(false)}
          onBack={
            modalState.checklistModalOpenedFromAddButton
              ? () => {
                  modalState.setIsChecklistModalOpen(false);
                  modalState.setIsAddToCardModalOpen(true);
                }
              : undefined
          }
          buttonRef={
            modalState.checklistModalOpenedFromAddButton
              ? (modalState.addButtonRef as React.RefObject<HTMLElement>)
              : modalState.checklistButtonRef
          }
        />

        {/* Add to Card Modal */}
        <AddToCardModal
          cardId={cardId}
          isOpen={modalState.isAddToCardModalOpen}
          onClose={() => modalState.setIsAddToCardModalOpen(false)}
          buttonRef={modalState.addButtonRef}
          isTemplate={card?.isTemplate}
          onOpenLabelsModal={() => {
            modalState.setIsAddToCardModalOpen(false);
            modalState.handleOpenLabelsModalFromAddButton();
          }}
          onOpenChecklistModal={() => {
            modalState.setIsAddToCardModalOpen(false);
            modalState.handleOpenChecklistModalFromAddButton();
          }}
          onOpenCalendarModal={() => {
            modalState.setIsAddToCardModalOpen(false);
            modalState.handleOpenCalendarModalFromAddButton();
          }}
          onOpenMembersModal={() => {
            modalState.setIsAddToCardModalOpen(false);
            modalState.handleOpenMembersModalFromAddButton();
          }}
          onOpenCustomFieldModal={() => {
            modalState.setIsAddToCardModalOpen(false);
            modalState.handleOpenCustomFieldModalFromAddButton();
          }}
        />

        {/* Calendar Modal */}
        <CalendarModal
          variant="card"
          cardId={cardId}
          isOpen={modalState.isCalendarModalOpen}
          onClose={() => modalState.setIsCalendarModalOpen(false)}
          onBack={
            modalState.calendarModalOpenedFromAddButton
              ? () => {
                  modalState.setIsCalendarModalOpen(false);
                  modalState.setIsAddToCardModalOpen(true);
                }
              : undefined
          }
          buttonRef={
            modalState.calendarModalOpenedFromAddButton
              ? (modalState.addButtonRef as React.RefObject<HTMLElement>)
              : card.dueDate || card.startDate
                ? modalState.dueDateBadgeRef
                : modalState.calendarButtonRef
          }
        />

        {/* Members Modal */}
        <MembersModal
          cardId={cardId}
          isOpen={modalState.isMembersModalOpen}
          onClose={() => modalState.setIsMembersModalOpen(false)}
          onBack={
            modalState.membersModalOpenedFromAddButton
              ? () => {
                  modalState.setIsMembersModalOpen(false);
                  modalState.setIsAddToCardModalOpen(true);
                }
              : undefined
          }
          buttonRef={
            modalState.membersModalOpenedFromAddButton
              ? (modalState.addButtonRef as React.RefObject<HTMLElement>)
              : assignedUsers.length > 0
                ? modalState.membersGadgetButtonRef
                : modalState.membersButtonRef
          }
          modalRef={modalState.membersModalRef}
        />

        {/* Create Card Template Modal */}
        <CreateCardTemplateModal
          cardId={cardId}
          isOpen={modalState.isCreateTemplateModalOpen}
          onClose={modalState.handleCloseCreateTemplateModal}
          buttonRef={modalState.createTemplateButtonRef}
        />

        {/* Assignment Modal for Checklist Items */}
        {assignModalData && (
          <AssignChecklist
            cardId={cardId}
            checklistId={assignModalData.checklistId}
            itemIndex={assignModalData.itemIndex}
            isOpen={assignModalData !== null}
            onClose={handleCloseAssignModal}
            buttonRef={assignModalData.buttonRef}
          />
        )}

        {/* Due Date Modal for Checklist Items */}
        {dueDateModalData && (
          <CalendarModal
            variant="checklist"
            cardId={cardId}
            checklistId={dueDateModalData.checklistId}
            itemIndex={dueDateModalData.itemIndex}
            isOpen={dueDateModalData !== null}
            onClose={handleCloseDueDateModal}
            buttonRef={dueDateModalData.buttonRef}
          />
        )}

        {/* Action Modal for Checklist Items */}
        {actionModalData && (
          <ChecklistItemActionModal
            cardId={cardId}
            actionModalData={actionModalData}
            onClose={handleCloseActionModal}
          />
        )}
      </div>

      {/* Active Field Editor Modal - Rendered outside main container to appear above other modals */}
      {/* Standalone ActiveFieldEditorModal removed; inline edit used inside CustomFieldModal */}

      {/* Inline color picker used inside CustomFieldModal; top-level wrapper removed */}

      {/* Custom Field Calendar Modal - Rendered at top level for proper positioning */}
      {modalState.customFieldCalendarData && (
        <CalendarModal
          variant="custom-field"
          cardId={cardId}
          fieldId={modalState.customFieldCalendarData.fieldId}
          fieldName={modalState.customFieldCalendarData.fieldName}
          currentValue={modalState.customFieldCalendarData.currentValue}
          isOpen={modalState.isCustomFieldCalendarModalOpen}
          onClose={modalState.handleCloseCustomFieldCalendarModal}
          buttonRef={{
            current: modalState.customFieldCalendarData.buttonRef || null,
          }}
        />
      )}
    </div>
  );
});

export { UnifiedCardModal };
