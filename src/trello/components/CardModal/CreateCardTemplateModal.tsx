import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { IconDown } from '../icons/card-modal/icon-down';
import { IconChecklist } from '../icons/card-modal/icon-checklist';
import { IconAttachment } from '../icons/card-modal/icon-attachment';
import { IconDescription } from '../icons/card-modal/icon-description';
import { CardModal, Button, Text, FlexContainer, UserAvatar } from '../ui';
import { getLabelColorClass } from '../../utils/label-colors';
import { useTrelloUI } from '../TrelloUIContext';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import {
  useCard,
  useCardList,
  useVisibleLists,
  useTrelloOperations,
  useCardLabels,
  useCardAssignedUsers,
  useCardComments,
} from '@trello/_lib/selectors';

type CreateCardTemplateModalProps = {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
};

// Mini card preview component
type CardPreviewProps = {
  card: {
    id: string;
    title: string;
    description?: string;
    labelIds?: string[];
    checklists?: Array<{
      id: string;
      title: string;
      items: Array<{ label: string; checked: boolean }>;
    }>;
    attachments?: string[];
    assignedTo?: string[];
  };
  showLabels: boolean;
  showChecklists: boolean;
  showMembers: boolean;
  showAttachments: boolean;
  editableTitle?: string;
  onTitleChange?: (title: string) => void;
  selectSignal?: number; // increments to request focus+select
};

type KeepOption = {
  key: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const CardPreview: FC<CardPreviewProps> = memo(function CardPreview({
  card,
  showLabels,
  showChecklists,
  showMembers,
  showAttachments,
  editableTitle,
  onTitleChange,
  selectSignal,
}) {
  const cardLabels = useCardLabels(card.id);
  const assignedUsers = useCardAssignedUsers(card.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoSelectedRef = useRef(false);
  const prevEditableTitleRef = useRef<string | undefined>(undefined);

  // Calculate checklist progress
  const checklistProgress = useMemo(() => {
    if (!card.checklists || card.checklists.length === 0) return null;

    const total = card.checklists.reduce((sum, cl) => sum + cl.items.length, 0);
    const completed = card.checklists.reduce(
      (sum, cl) => sum + cl.items.filter((item) => item.checked).length,
      0
    );

    return { completed, total };
  }, [card.checklists]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editableTitle]);

  // Auto-select text only the first time editableTitle is populated (on open)
  useEffect(() => {
    const textarea = textareaRef.current;
    const prevEditableTitle = prevEditableTitleRef.current;
    const isFirstPopulate = prevEditableTitle == null && !!editableTitle;

    if (textarea && onTitleChange && isFirstPopulate && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;

      // Use requestAnimationFrame to ensure the modal is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          textarea.select();
          textarea.focus();
        });
      });
    }

    // Track previous value to avoid auto-select after user clears and types again
    prevEditableTitleRef.current = editableTitle;
  }, [editableTitle, onTitleChange]);

  // Explicit select request from parent (fires once per increment)
  useEffect(() => {
    if (selectSignal == null) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.select();
      });
    });
    // no cleanup necessary
  }, [selectSignal]);

  const displayTitle = editableTitle ?? card.title;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* Labels */}
      {showLabels && cardLabels && cardLabels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {cardLabels.slice(0, 3).map((label) => (
            <div
              key={label.id}
              className={`h-2 w-8 rounded-sm ${getLabelColorClass(label.color)}`}
            />
          ))}
          {cardLabels.length > 3 && (
            <div className="flex h-2 w-4 items-center justify-center rounded-sm bg-gray-300">
              <span className="text-xs text-gray-600">+{cardLabels.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Card title - editable if onTitleChange is provided */}
      {onTitleChange ? (
        <textarea
          ref={textareaRef}
          value={displayTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mb-2 -ml-1 w-full resize-none overflow-hidden rounded px-1 text-sm leading-5 font-medium text-gray-900 focus:outline-none"
          placeholder="Enter card title..."
          rows={1}
        />
      ) : (
        <h3 className="mb-2 max-h-10 overflow-hidden text-sm leading-5 font-medium text-gray-900">
          {displayTitle}
        </h3>
      )}

      {/* Bottom row with gadgets */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {card.description && card.description.trim() && (
            <IconDescription className="h-4 w-4 text-gray-600" />
          )}
          {/* Checklist progress */}
          {showChecklists && checklistProgress && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <IconChecklist className="h-3 w-3" />
              <span>
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
            </div>
          )}

          {/* Attachments count */}
          {showAttachments && card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <IconAttachment className="h-3 w-3" />
              <span>{card.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assigned members */}
        {showMembers && assignedUsers && assignedUsers.length > 0 && (
          <div className="flex -space-x-1">
            {assignedUsers.slice(0, 3).map((user) => (
              <UserAvatar key={user.id} user={user} size="sm" />
            ))}
            {assignedUsers.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs font-semibold text-white">
                +{assignedUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

const CreateCardTemplateModal: FC<CreateCardTemplateModalProps> = memo(
  function CreateCardTemplateModal({ cardId, isOpen, onClose, buttonRef }) {
    const card = useCard(cardId);
    const currentList = useCardList(cardId);
    const visibleLists = useVisibleLists();
    const { createCardFromTemplate } = useTrelloOperations();
    const { openCardModal } = useTrelloUI();
    const modalRef = useRef<HTMLDivElement>(null);
    const cardLabels = useCardLabels(cardId);
    const assignedUsers = useCardAssignedUsers(cardId);
    const comments = useCardComments(cardId);

    const [selectedListId, setSelectedListId] = useState(''); // Will be set to first visible list
    const [titleSelectSignal, setTitleSelectSignal] = useState(0);
    const modalPosition = useAnchoredPosition({
      isOpen,
      anchorRef: buttonRef,
      contentRef: modalRef,
      placement: 'bottom-start',
      offset: 8,
      fallbackHeight: 500,
      fallbackWidth: 320,
      viewportPadding: 10,
      lockOnOpen: true,
      reflowOnScroll: false,
      reflowOnContentResize: false,
    });
    const modalHeight = useDynamicModalHeight();

    // Keep state for what to copy
    const [keepChecklists, setKeepChecklists] = useState(true);
    const [keepLabels, setKeepLabels] = useState(true);
    const [keepMembers, setKeepMembers] = useState(true);
    const [keepAttachments, setKeepAttachments] = useState(true);
    const [keepComments, setKeepComments] = useState(true);
    const [keepCustomFields, setKeepCustomFields] = useState(true);
    const [customTitle, setCustomTitle] = useState('');

    // Set default list when modal opens or lists change
    useEffect(() => {
      if (isOpen && visibleLists.length > 0 && !selectedListId) {
        // Default to first visible list that's not inbox
        const firstNonInboxList = visibleLists.find((list) => list.id !== 'inbox');
        setSelectedListId(firstNonInboxList?.id || visibleLists[0]?.id || '');
      }
    }, [isOpen, visibleLists, selectedListId]);

    // Initialize custom title when modal opens
    useEffect(() => {
      if (isOpen && card) {
        setCustomTitle(card.title);
      }
    }, [isOpen, card]);

    // Request an explicit title select after open
    useEffect(() => {
      if (isOpen) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTitleSelectSignal((s) => s + 1);
          });
        });
      }
    }, [isOpen]);

    // Reset modal state when it closes
    useEffect(() => {
      if (!isOpen) {
        setSelectedListId('');
        setKeepChecklists(true);
        setKeepLabels(true);
        setKeepMembers(true);
        setKeepAttachments(true);
        setKeepComments(true);
        setKeepCustomFields(true);
        setCustomTitle('');
      }
    }, [isOpen]);

    if (!card || !card.isTemplate) return null;

    const handleCreateCard = () => {
      try {
        const newCardId = createCardFromTemplate({
          templateCardId: cardId,
          targetListId: selectedListId,
          title: customTitle,
          keepChecklists,
          keepLabels,
          keepMembers,
          keepAttachments,
          keepComments,
          keepCustomFields,
        });
        onClose();
        // Automatically open the newly created card
        openCardModal(newCardId, { listId: selectedListId });
      } catch (error) {
        console.error('Failed to create card from template:', error);
      }
    };

    // Determine which keep options to show based on template content
    const hasChecklists = card.checklistIds && card.checklistIds.length > 0;
    const hasLabels = cardLabels && cardLabels.length > 0;
    const hasMembers = assignedUsers && assignedUsers.length > 0;
    const hasAttachments = card.attachments && card.attachments.length > 0;
    const hasComments = comments.length > 0;
    const activeCustomFields = card.customFields ?? card.preservedCustomFields ?? [];
    const customFieldValueCount = activeCustomFields.filter(
      (field) => field.value != null && field.value !== ''
    ).length;
    const hasCustomFieldValues = customFieldValueCount > 0;

    const keepOptions: KeepOption[] = [];
    if (hasLabels) {
      keepOptions.push({
        key: 'labels',
        label: `Labels (${cardLabels?.length ?? 0})`,
        checked: keepLabels,
        onChange: setKeepLabels,
      });
    }
    if (hasComments) {
      keepOptions.push({
        key: 'comments',
        label: `Comments (${comments.length})`,
        checked: keepComments,
        onChange: setKeepComments,
      });
    }
    if (hasMembers) {
      keepOptions.push({
        key: 'members',
        label: `Members (${assignedUsers?.length ?? 0})`,
        checked: keepMembers,
        onChange: setKeepMembers,
      });
    }
    if (hasChecklists) {
      keepOptions.push({
        key: 'checklists',
        label: `Checklists (${card.checklistIds?.length ?? 0})`,
        checked: keepChecklists,
        onChange: setKeepChecklists,
      });
    }
    if (hasCustomFieldValues) {
      keepOptions.push({
        key: 'customFields',
        label: `Custom fields (${customFieldValueCount})`,
        checked: keepCustomFields,
        onChange: setKeepCustomFields,
      });
    }
    if (hasAttachments) {
      keepOptions.push({
        key: 'attachments',
        label: `Attachments (${card.attachments?.length ?? 0})`,
        checked: keepAttachments,
        onChange: setKeepAttachments,
      });
    }

    const shouldShowKeepSection = keepOptions.length > 0;
    const isCreateDisabled = !customTitle.trim();

    return (
      <CardModal
        ref={modalRef}
        title="Create card from template"
        isOpen={isOpen}
        onClose={onClose}
        position={{ top: modalPosition.top, left: modalPosition.left }}
        dataAttribute="data-create-template-modal"
        buttonRef={buttonRef}
        containerClassName={modalHeight.modalContainerClasses}
        className={`z-[60] ${modalHeight.modalClasses}`}
      >
        <div className={`p-4 ${modalHeight.contentClasses}`}>
          {/* Card Preview */}
          <div className="mb-4">
            <CardPreview
              card={card}
              showLabels={keepLabels}
              showChecklists={keepChecklists}
              showMembers={keepMembers}
              showAttachments={keepAttachments}
              editableTitle={customTitle}
              onTitleChange={setCustomTitle}
              selectSignal={titleSelectSignal}
            />
          </div>

          {/* Keep section */}
          {shouldShowKeepSection && (
            <div className="mb-4">
              <Text variant="label" size="sm" className="mb-3 block text-gray-800 normal-case">
                Keep…
              </Text>

              <div className="space-y-2">
                {keepOptions.map((option) => (
                  <label key={option.key} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={option.checked}
                      onChange={(e) => option.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* List selector */}
          <div className="mb-4">
            <Text variant="label" size="sm" className="mb-2 block text-gray-800 normal-case">
              List
            </Text>
            <div className="relative">
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full appearance-none rounded-sm border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {visibleLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
              <IconDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className={modalHeight.footerClasses}>
          <div className="p-4 pt-0">
            {/* Create button */}
            <Button
              onClick={handleCreateCard}
              disabled={isCreateDisabled}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
            >
              Create card
            </Button>
          </div>
        </div>
      </CardModal>
    );
  }
);

export { CreateCardTemplateModal };
