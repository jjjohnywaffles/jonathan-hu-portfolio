import React, { memo } from 'react';
import type { FC } from 'react';
import { IconAdd } from '../../icons/card-modal/icon-add';
import { IconLabel } from '../../icons/card-modal/icon-label';
import { IconClock } from '../../icons/card-modal/icon-clock';
import { IconChecklist } from '../../icons/card-modal/icon-checklist';
import { IconMembers } from '../../icons/card-modal/icon-members';
import { IconLocation } from '../../icons/card-modal/icon-location';
import { ActionButton, FlexContainer } from '../../ui';
import type { Label } from '@trello/_lib/types';

type AddToCardSectionProps = {
  cardLabels: Label[] | undefined;
  addButtonRef: React.RefObject<HTMLButtonElement>;
  labelsButtonRef: React.RefObject<HTMLButtonElement>;
  checklistButtonRef: React.RefObject<HTMLButtonElement>;
  onOpenAddToCardModal: () => void;
  onOpenLabelsModal: () => void;
  onOpenChecklistModal: () => void;
  className?: string;
};

const AddToCardSection: FC<AddToCardSectionProps> = memo(function AddToCardSection({
  cardLabels,
  addButtonRef,
  labelsButtonRef,
  checklistButtonRef,
  onOpenAddToCardModal,
  onOpenLabelsModal,
  onOpenChecklistModal,
  className = 'mb-6',
}) {
  return (
    <section className={className}>
      <FlexContainer className="mb-4 ml-7 flex-wrap">
        {/* Add button */}
        <ActionButton ref={addButtonRef} onClick={onOpenAddToCardModal}>
          <IconAdd className="h-4 w-4" />
          Add
        </ActionButton>

        {/* Labels button - only show when no labels exist */}
        {!(cardLabels && cardLabels.length > 0) && (
          <ActionButton ref={labelsButtonRef} onClick={onOpenLabelsModal}>
            <IconLabel className="h-4 w-4" />
            Labels
          </ActionButton>
        )}

        {/* Dates button */}
        <ActionButton>
          <IconClock className="h-4 w-4" />
          Dates
        </ActionButton>

        {/* Checklist button */}
        <ActionButton ref={checklistButtonRef} onClick={onOpenChecklistModal}>
          <IconChecklist className="h-4 w-4" />
          Checklist
        </ActionButton>

        {/* Members button */}
        <ActionButton>
          <IconMembers className="h-4 w-4" />
          Members
        </ActionButton>

        {/* Location button - only show when labels exist */}
        {cardLabels && cardLabels.length > 0 && (
          <ActionButton>
            <IconLocation className="h-4 w-4" />
            Location
          </ActionButton>
        )}
      </FlexContainer>
    </section>
  );
});

export { AddToCardSection };
