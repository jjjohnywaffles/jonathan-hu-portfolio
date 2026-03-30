import React, { memo } from 'react';
import type { FC } from 'react';
import { Dropdown, DropdownItem } from '../../ui';
import { IconReorder } from '../../icons/CustomFieldsIcons';

type ReorderDropdownProps = {
  fieldId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onReorder: (fieldId: string, direction: 'up' | 'down') => void;
};

const ReorderDropdown: FC<ReorderDropdownProps> = memo(function ReorderDropdown({
  fieldId,
  canMoveUp,
  canMoveDown,
  onReorder,
}) {
  return (
    <Dropdown
      trigger={<IconReorder className="h-4 w-4 text-gray-500" />}
      position="bottom-left"
      usePortal={true}
      closeOnClick={true}
      className="flex w-6 items-center justify-center rounded bg-gray-100 py-1.5 transition-colors hover:bg-gray-200"
      contentClassName="w-auto min-w-0"
      portalZIndex="z-[80]"
    >
      <DropdownItem
        onClick={() => onReorder(fieldId, 'up')}
        disabled={!canMoveUp}
        className={!canMoveUp ? 'cursor-not-allowed text-gray-400' : ''}
      >
        Move up
      </DropdownItem>
      <DropdownItem
        onClick={() => onReorder(fieldId, 'down')}
        disabled={!canMoveDown}
        className={!canMoveDown ? 'cursor-not-allowed text-gray-400' : ''}
      >
        Move down
      </DropdownItem>
    </Dropdown>
  );
});

export { ReorderDropdown };
