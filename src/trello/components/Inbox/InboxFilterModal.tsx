import React, { memo, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { IconDueDate } from '../icons/card/icon-duedate';
import { CardModal, Dropdown, DropdownItem } from '../ui';
import { useAnchoredPosition } from '@trello/hooks/use-anchored-position';
import { useDynamicModalHeight } from '@trello/hooks/use-dynamic-modal-height';
import { useUsers, useLabels, useCurrentUser } from '@trello/_lib/selectors';
import { getLabelColorClass, getLabelColorDisplayName } from '@trello/utils/label-colors';
import { getUserInitials } from '@trello/utils/user-initials';

type FilterOptions = {
  keyword: string;
  cardCreated?: {
    lastWeek: boolean;
    lastTwoWeeks: boolean;
    lastMonth: boolean;
  };
  members?: {
    noMembers: boolean;
    assignedToMe: boolean;
    selectedMembers: string[];
    enableDropdown: boolean;
  };
  cardStatus: {
    markedComplete: boolean;
    notMarkedComplete: boolean;
  };
  dueDate: {
    noDates: boolean;
    overdue: boolean;
    nextDay: boolean;
    nextWeek: boolean;
    nextMonth: boolean;
  };
  labels?: {
    noLabels: boolean;
    selectedLabels: string[];
    enableDropdown: boolean;
  };
  activity?: {
    lastWeek: boolean;
    lastTwoWeeks: boolean;
    lastFourWeeks: boolean;
    withoutActivity: boolean;
  };
};

type FilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
  initialFilters?: FilterOptions;
  variant?: 'inbox' | 'board';
};

// Member Dropdown Component
type MemberDropdownProps = {
  selectedMembers: string[];
  onChange: (memberIds: string[]) => void;
  isEnabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onBothChange?: (enabled: boolean, memberIds: string[]) => void;
};

const MemberDropdown: FC<MemberDropdownProps> = memo(function MemberDropdown({
  selectedMembers,
  onChange,
  isEnabled,
  onEnabledChange,
  onBothChange,
}) {
  const users = useUsers();
  const currentUser = useCurrentUser();

  // Filter out current user since "Cards assigned to me" covers that
  const availableUsers = Object.values(users).filter((user) => user.id !== currentUser.id);

  const handleMemberToggle = (userId: string) => {
    // Toggle the member selection
    const newSelectedMembers = selectedMembers.includes(userId)
      ? selectedMembers.filter((id) => id !== userId)
      : [...selectedMembers, userId];

    // Keep checkbox checked if any members are selected, unchecked if none
    const shouldBeEnabled = newSelectedMembers.length > 0;

    // Update both member selection and checkbox state together
    if (onBothChange) {
      onBothChange(shouldBeEnabled, newSelectedMembers);
    } else {
      onChange(newSelectedMembers);
      if (shouldBeEnabled !== isEnabled) {
        onEnabledChange(shouldBeEnabled);
      }
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      // Checking the box selects all members
      if (onBothChange) {
        onBothChange(
          true,
          availableUsers.map((user) => user.id)
        );
      } else {
        onEnabledChange(true);
        onChange(availableUsers.map((user) => user.id));
      }
    } else {
      // Unchecking the box deselects all members
      if (onBothChange) {
        onBothChange(false, []);
      } else {
        onEnabledChange(false);
        onChange([]);
      }
    }
  };

  const buttonText = getDropdownButtonText(selectedMembers.length, 'member');

  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={(e) => handleCheckboxChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1">
        <Dropdown
          trigger={
            <div className="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50">
              <span className="font-normal text-gray-700">{buttonText}</span>
              <span className="text-gray-400">▼</span>
            </div>
          }
          position="bottom-left"
          className="w-full"
          closeOnClick={false}
        >
          {availableUsers.map((user) => (
            <DropdownItem
              key={user.id}
              onClick={() => handleMemberToggle(user.id)}
              leftIcon={
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user.id)}
                  readOnly
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
              }
            >
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    title={user.displayName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-gray-700"
                    title={user.displayName}
                  >
                    {getUserInitials(user.displayName)}
                  </div>
                )}
                <span className="font-normal text-gray-900">{user.displayName}</span>
              </div>
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
    </div>
  );
});

// Helper function for dropdown button text
const getDropdownButtonText = (selectedCount: number, itemType: string): string => {
  return selectedCount === 0
    ? `Select ${itemType}`
    : `${selectedCount} ${itemType}${selectedCount === 1 ? '' : 's'} selected`;
};

// Reusable checkbox component
type CheckboxOptionProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

const CheckboxOption: FC<CheckboxOptionProps> = memo(function CheckboxOption({
  checked,
  onChange,
  label,
  disabled = false,
}) {
  return (
    <label className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
      />
      <span className={`text-sm font-normal ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  );
});

// Labels Checkboxes Component - for green, yellow, orange
type LabelsCheckboxesProps = {
  selectedLabels: string[];
  onChange: (labelIds: string[]) => void;
};

const LabelsCheckboxes: FC<LabelsCheckboxesProps> = memo(function LabelsCheckboxes({
  selectedLabels,
  onChange,
}) {
  const boardLabels = useLabels();

  // Find actual labels by color
  const colorLabels = ['green', 'yellow', 'orange']
    .map((color) => {
      return boardLabels.find((label) => label.color === color);
    })
    .filter((label): label is NonNullable<typeof label> => label != null);

  return (
    <>
      {colorLabels.map((label) => {
        const isChecked = selectedLabels.includes(label.id);

        return (
          <label key={label.color} className="flex items-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                const newSelectedLabels = e.target.checked
                  ? [...selectedLabels, label.id]
                  : selectedLabels.filter((l) => l !== label.id);
                onChange(newSelectedLabels);
              }}
              className="mr-3 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="group relative w-full">
              <div
                className={`h-8 w-full rounded-sm px-6 text-left text-sm font-medium text-black transition-opacity hover:opacity-80 ${getLabelColorClass(label.color)}`}
                title={label.color}
              >
                {/* Empty - just colored rectangle like labels modal */}
              </div>
              <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded bg-black px-2 py-0.5 text-xs whitespace-nowrap text-white opacity-0 group-hover:opacity-100">
                {label.color}
              </span>
            </div>
          </label>
        );
      })}
    </>
  );
});

// Label Dropdown Component
type LabelDropdownProps = {
  selectedLabels: string[];
  onChange: (labelIds: string[]) => void;
  isEnabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onBothChange?: (enabled: boolean, labelIds: string[]) => void;
};

const LabelDropdown: FC<LabelDropdownProps> = memo(function LabelDropdown({
  selectedLabels,
  onChange,
  isEnabled,
  onEnabledChange,
  onBothChange,
}) {
  const boardLabels = useLabels();

  // Include ALL labels in the dropdown (including green, yellow, orange)
  // They appear both as dedicated checkboxes and in the dropdown
  const availableLabels = boardLabels;

  const handleLabelToggle = (labelId: string) => {
    const newSelectedLabels = selectedLabels.includes(labelId)
      ? selectedLabels.filter((id) => id !== labelId)
      : [...selectedLabels, labelId];
    // Selecting labels via dropdown should also enable the dropdown checkbox
    if (onBothChange) {
      onBothChange(newSelectedLabels.length > 0, newSelectedLabels);
    } else {
      onChange(newSelectedLabels);
      onEnabledChange(newSelectedLabels.length > 0);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onBothChange) {
      // Update both enabled state and selected labels in single call
      // When checking, select all labels if none are selected, otherwise keep current selection
      const newLabels = checked
        ? selectedLabels.length > 0
          ? selectedLabels
          : boardLabels.map((label) => label.id)
        : [];
      onBothChange(checked, newLabels);
    } else {
      // Fallback
      onEnabledChange(checked);
      if (checked) {
        // Select all labels if none are selected, otherwise keep current selection
        const newLabels =
          selectedLabels.length > 0 ? selectedLabels : boardLabels.map((label) => label.id);
        onChange(newLabels);
      } else {
        onChange([]);
      }
    }
  };

  const buttonText = getDropdownButtonText(selectedLabels.length, 'label');

  const hasAdditionalLabels = availableLabels.length > 0;

  if (!hasAdditionalLabels) {
    return (
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={false}
          disabled={true}
          readOnly
          className="h-4 w-4 cursor-not-allowed rounded border-gray-300 text-gray-400"
        />
        <div className="text-sm font-normal text-gray-500 italic">No labels available</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={(e) => handleCheckboxChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1">
        <Dropdown
          trigger={
            <div className="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50">
              <span className="font-normal text-gray-700">{buttonText}</span>
              <span className="text-gray-400">▼</span>
            </div>
          }
          position="bottom-left"
          className="w-full"
          contentClassName="w-full max-h-48 overflow-y-auto"
          closeOnClick={false}
          disabled={false}
        >
          {availableLabels.map((label) => {
            const title = (label.title ?? '').trim();
            const displayName = title.length > 0 ? title : getLabelColorDisplayName(label.color);
            const isDark = label.color.endsWith('_dark');
            return (
              <DropdownItem
                key={label.id}
                onClick={() => handleLabelToggle(label.id)}
                leftIcon={
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(label.id)}
                    readOnly
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                }
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={`flex h-8 min-w-0 items-center justify-start overflow-hidden rounded-sm px-2 text-xs font-medium transition-opacity hover:opacity-80 ${getLabelColorClass(label.color)} ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                    title={displayName}
                  >
                    <span className="truncate">{displayName}</span>
                  </div>
                </div>
              </DropdownItem>
            );
          })}
        </Dropdown>
      </div>
    </div>
  );
});

const FilterModal: FC<FilterModalProps> = memo(function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  buttonRef,
  initialFilters,
  variant = 'inbox',
}) {
  const getInitialFilters = (): FilterOptions => {
    const base = {
      keyword: '',
      cardStatus: {
        markedComplete: false,
        notMarkedComplete: false,
      },
      dueDate: {
        noDates: false,
        overdue: false,
        nextDay: false,
        nextWeek: false,
        nextMonth: false,
      },
    };

    if (variant === 'inbox') {
      return {
        ...base,
        cardCreated: {
          lastWeek: false,
          lastTwoWeeks: false,
          lastMonth: false,
        },
      };
    } else {
      return {
        ...base,
        members: {
          noMembers: false,
          assignedToMe: false,
          selectedMembers: [],
          enableDropdown: false,
        },
        labels: {
          noLabels: false,
          selectedLabels: [],
          enableDropdown: false,
        },
        activity: {
          lastWeek: false,
          lastTwoWeeks: false,
          lastFourWeeks: false,
          withoutActivity: false,
        },
      };
    }
  };

  const [filters, setFilters] = useState<FilterOptions>(initialFilters || getInitialFilters());

  const modalRef = useRef<HTMLDivElement>(null);
  const modalHeight = useDynamicModalHeight();

  // Use new positioning hook (bottom-left/"start"), with estimated height
  const estimatedHeight = variant === 'inbox' ? 520 : 620;
  const position = useAnchoredPosition({
    isOpen,
    anchorRef: buttonRef,
    contentRef: modalRef,
    placement: 'bottom-start',
    offset: 8,
    fallbackWidth: 320,
    fallbackHeight: estimatedHeight,
    viewportPadding: 10,
    lockOnOpen: true,
    reflowOnScroll: false,
    reflowOnContentResize: false,
  });

  // Sync filters with initialFilters when they change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Generic handler to update any filter field and apply changes
  const updateFilters = (updates: Partial<FilterOptions>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onApplyFilters(newFilters);
  };

  const handleKeywordChange = (value: string) => {
    updateFilters({ keyword: value });
  };

  const handleCardCreatedChange = (
    field: keyof NonNullable<FilterOptions['cardCreated']>,
    checked: boolean
  ) => {
    if (!filters.cardCreated) return;
    updateFilters({
      cardCreated: { ...filters.cardCreated, [field]: checked },
    });
  };

  const handleMembersChange = (
    field: keyof NonNullable<FilterOptions['members']>,
    value: boolean | string[]
  ) => {
    if (!filters.members) return;
    updateFilters({ members: { ...filters.members, [field]: value } });
  };

  const handleLabelsChange = (
    field: keyof NonNullable<FilterOptions['labels']>,
    value: boolean | string[]
  ) => {
    if (!filters.labels) return;
    updateFilters({ labels: { ...filters.labels, [field]: value } });
  };

  const handleActivityChange = (
    field: keyof NonNullable<FilterOptions['activity']>,
    checked: boolean
  ) => {
    if (!filters.activity) return;
    updateFilters({ activity: { ...filters.activity, [field]: checked } });
  };

  const handleCardStatusChange = (field: keyof FilterOptions['cardStatus'], checked: boolean) => {
    // Enforce mutual exclusivity between markedComplete and notMarkedComplete
    const otherField = field === 'markedComplete' ? 'notMarkedComplete' : 'markedComplete';
    const next = {
      ...filters.cardStatus,
      [field]: checked,
      // If one is checked, force the other off
      [otherField]: checked ? false : filters.cardStatus[otherField],
    } as FilterOptions['cardStatus'];
    updateFilters({ cardStatus: next });
  };

  const handleDueDateChange = (field: keyof FilterOptions['dueDate'], checked: boolean) => {
    updateFilters({ dueDate: { ...filters.dueDate, [field]: checked } });
  };

  return (
    <CardModal
      ref={modalRef}
      title="Filter"
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      buttonRef={buttonRef}
      dataAttribute="data-inbox-filter-modal"
      containerClassName={`z-[70] ${modalHeight.modalContainerClasses}`}
      className={`max-h-[calc(100vh-110px)] !w-80 ${modalHeight.modalClasses}`}
    >
      <div className={`space-y-6 p-4 ${modalHeight.contentClasses}`}>
        {/* Keyword Section */}
        <div>
          <label className="mb-2 block text-sm font-normal text-gray-700">Keyword</label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="Enter a keyword"
            className="matrices-disabled w-full cursor-not-allowed rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled
            tabIndex={-1}
            aria-disabled="true"
          />
          <p className="mt-1 text-xs font-normal text-gray-500">
            {variant === 'inbox'
              ? 'Search card names.'
              : 'Search cards, members, labels, and more.'}
          </p>
        </div>

        {/* Card Created Section (Inbox Only) */}
        {variant === 'inbox' && filters.cardCreated && (
          <div>
            <h3 className="mb-3 text-sm font-normal text-gray-700">Card created</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.cardCreated.lastWeek}
                  onChange={(e) => handleCardCreatedChange('lastWeek', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">Created in the last week</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.cardCreated.lastTwoWeeks}
                  onChange={(e) => handleCardCreatedChange('lastTwoWeeks', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">
                  Created in the last two weeks
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.cardCreated.lastMonth}
                  onChange={(e) => handleCardCreatedChange('lastMonth', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">Created in the last month</span>
              </label>
            </div>
          </div>
        )}

        {/* Members Section (Board Only) */}
        {variant === 'board' && filters.members && (
          <div>
            <h3 className="mb-3 text-sm font-normal text-gray-700">Members</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.members.noMembers}
                  onChange={(e) => handleMembersChange('noMembers', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">No members</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.members.assignedToMe}
                  onChange={(e) => handleMembersChange('assignedToMe', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">Cards assigned to me</span>
              </label>
              {/* Member Dropdown */}
              <MemberDropdown
                selectedMembers={filters.members?.selectedMembers || []}
                onChange={(memberIds) => handleMembersChange('selectedMembers', memberIds)}
                isEnabled={filters.members?.enableDropdown || false}
                onEnabledChange={(enabled) => handleMembersChange('enableDropdown', enabled)}
                onBothChange={(enabled, memberIds) => {
                  if (!filters.members) return;
                  updateFilters({
                    members: {
                      ...filters.members,
                      enableDropdown: enabled,
                      selectedMembers: memberIds,
                    },
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* Card Status Section */}
        <div>
          <h3 className="mb-3 text-sm font-normal text-gray-700">Card status</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.cardStatus.markedComplete}
                onChange={(e) => handleCardStatusChange('markedComplete', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-normal text-gray-700">Marked as complete</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.cardStatus.notMarkedComplete}
                onChange={(e) => handleCardStatusChange('notMarkedComplete', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-normal text-gray-700">Not marked as complete</span>
            </label>
          </div>
        </div>

        {/* Due Date Section */}
        <div>
          <h3 className="mb-3 text-sm font-normal text-gray-700">Due date</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.dueDate.noDates}
                onChange={(e) => handleDueDateChange('noDates', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                  <IconDueDate className="h-3 w-3 text-gray-600" />
                </span>
                <span className="text-sm font-normal text-gray-700">No dates</span>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.dueDate.overdue}
                onChange={(e) => handleDueDateChange('overdue', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600">
                  <IconDueDate className="h-3 w-3 text-white" />
                </span>
                <span className="text-sm font-normal text-gray-700">Overdue</span>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.dueDate.nextDay}
                onChange={(e) => handleDueDateChange('nextDay', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400">
                  <IconDueDate className="h-3 w-3 text-yellow-900" />
                </span>
                <span className="text-sm font-normal text-gray-700">Due in the next day</span>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.dueDate.nextWeek}
                onChange={(e) => handleDueDateChange('nextWeek', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                  <IconDueDate className="h-3 w-3 text-gray-600" />
                </span>
                <span className="text-sm font-normal text-gray-700">Due in the next week</span>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.dueDate.nextMonth}
                onChange={(e) => handleDueDateChange('nextMonth', e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                  <IconDueDate className="h-3 w-3 text-gray-600" />
                </span>
                <span className="text-sm font-normal text-gray-700">Due in the next month</span>
              </div>
            </label>
          </div>
        </div>

        {/* Labels Section (Board Only) */}
        {variant === 'board' && filters.labels && (
          <div>
            <h3 className="mb-3 text-sm font-normal text-gray-700">Labels</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.labels.noLabels}
                  onChange={(e) => handleLabelsChange('noLabels', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">No labels</span>
              </label>

              {/* Static color options */}
              <LabelsCheckboxes
                selectedLabels={filters.labels.selectedLabels}
                onChange={(newSelectedLabels) => {
                  // Update both selectedLabels and enableDropdown in a single update
                  if (!filters.labels) return;

                  // If all labels are unchecked, disable the dropdown
                  // If any labels are checked, enable the dropdown
                  const shouldEnableDropdown = newSelectedLabels.length > 0;

                  updateFilters({
                    labels: {
                      ...filters.labels,
                      selectedLabels: newSelectedLabels,
                      enableDropdown: shouldEnableDropdown,
                    },
                  });
                }}
              />

              {/* Label Dropdown */}
              <LabelDropdown
                selectedLabels={filters.labels?.selectedLabels || []}
                onChange={(labelIds) => handleLabelsChange('selectedLabels', labelIds)}
                isEnabled={filters.labels?.enableDropdown || false}
                onEnabledChange={(enabled) => handleLabelsChange('enableDropdown', enabled)}
                onBothChange={(enabled, labelIds) => {
                  if (!filters.labels) return;
                  updateFilters({
                    labels: {
                      ...filters.labels,
                      enableDropdown: enabled,
                      selectedLabels: labelIds,
                    },
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* Activity Section (Board Only) */}
        {variant === 'board' && filters.activity && (
          <div>
            <h3 className="mb-3 text-sm font-normal text-gray-700">Activity</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.activity.lastWeek}
                  onChange={(e) => handleActivityChange('lastWeek', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">Active in the last week</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.activity.lastTwoWeeks}
                  onChange={(e) => handleActivityChange('lastTwoWeeks', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">
                  Active in the last two weeks
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.activity.lastFourWeeks}
                  onChange={(e) => handleActivityChange('lastFourWeeks', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">
                  Active in the last four weeks
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.activity.withoutActivity}
                  onChange={(e) => handleActivityChange('withoutActivity', e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-normal text-gray-700">
                  Without activity in the last four weeks
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </CardModal>
  );
});

// Utility function to count active filters
const countActiveFilters = (filters: FilterOptions): number => {
  let count = 0;

  // Count keyword filter
  if (filters.keyword.trim()) count++;

  // Count card created filters (inbox only)
  if (filters.cardCreated) {
    if (filters.cardCreated.lastWeek) count++;
    if (filters.cardCreated.lastTwoWeeks) count++;
    if (filters.cardCreated.lastMonth) count++;
  }

  // Count member filters (board only)
  if (filters.members) {
    if (filters.members.noMembers) count++;
    if (filters.members.assignedToMe) count++;
    if (filters.members.selectedMembers.length > 0) count += filters.members.selectedMembers.length;
  }

  // Count card status filters
  if (filters.cardStatus.markedComplete) count++;
  if (filters.cardStatus.notMarkedComplete) count++;

  // Count due date filters
  if (filters.dueDate.noDates) count++;
  if (filters.dueDate.overdue) count++;
  if (filters.dueDate.nextDay) count++;
  if (filters.dueDate.nextWeek) count++;
  if (filters.dueDate.nextMonth) count++;

  // Count label filters (board only)
  if (filters.labels) {
    if (filters.labels.noLabels) count++;
    if (filters.labels.selectedLabels.length > 0) count += filters.labels.selectedLabels.length;
  }

  // Count activity filters (board only)
  if (filters.activity) {
    if (filters.activity.lastWeek) count++;
    if (filters.activity.lastTwoWeeks) count++;
    if (filters.activity.lastFourWeeks) count++;
    if (filters.activity.withoutActivity) count++;
  }

  return count;
};

export { FilterModal, FilterModal as InboxFilterModal, countActiveFilters };
export type { FilterOptions };
