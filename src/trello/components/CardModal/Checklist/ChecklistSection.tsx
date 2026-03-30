import React, { memo } from 'react';
import type { FC } from 'react';
import { ChecklistSectionItem } from './ChecklistSectionItem';
import { useCardChecklists } from '@trello/_lib/selectors';

type ChecklistSectionProps = {
  cardId: string;
  onOpenAssignModal?: (
    checklistId: string,
    itemIndex: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  assignModalData?: {
    checklistId: string;
    itemIndex: number;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
  } | null;
  onOpenDueDateModal?: (
    checklistId: string,
    itemIndex: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  dueDateModalData?: {
    checklistId: string;
    itemIndex: number;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
  } | null;
  onOpenActionModal?: (
    checklistId: string,
    itemIndex: number,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  actionModalData?: {
    checklistId: string;
    itemIndex: number;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
  } | null;
};

const ChecklistSection: FC<ChecklistSectionProps> = memo(function ChecklistSection({
  cardId,
  onOpenAssignModal,
  assignModalData,
  onOpenDueDateModal,
  dueDateModalData,
  onOpenActionModal,
  actionModalData,
}) {
  const checklists = useCardChecklists(cardId);

  // If no checklists exist, don't render anything
  if (!checklists || checklists.length === 0) {
    return null;
  }

  return (
    <section className="mb-4">
      {/* Render checklists */}
      {checklists.map((checklist) => (
        <ChecklistSectionItem
          key={checklist.id}
          cardId={cardId}
          checklistId={checklist.id}
          title={checklist.title}
          items={checklist.items}
          onOpenAssignModal={(itemIndex, buttonRef) =>
            onOpenAssignModal?.(checklist.id, itemIndex, buttonRef)
          }
          assignModalData={assignModalData}
          onOpenDueDateModal={(itemIndex, buttonRef) =>
            onOpenDueDateModal?.(checklist.id, itemIndex, buttonRef)
          }
          dueDateModalData={dueDateModalData}
          onOpenActionModal={(itemIndex, buttonRef) =>
            onOpenActionModal?.(checklist.id, itemIndex, buttonRef)
          }
          actionModalData={actionModalData}
        />
      ))}
    </section>
  );
});

export { ChecklistSection };
