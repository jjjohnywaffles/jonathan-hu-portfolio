import React, { memo } from 'react';
import type { FC } from 'react';
import { UnifiedCardModal } from './CardModal/UnifiedCardModal';
import { CardModalAction } from './CardModal/CardModalAction';
import { MirrorCardAction } from './CardModal/MirrorCardAction';
import { MirrorCardPrefix } from './CardModal/sections/MirrorCardPrefix';
import { useTrelloUI } from './TrelloUIContext';
import { useCard, useIsCardInInbox } from '@trello/_lib/selectors';

const GlobalCardModal: FC = memo(function GlobalCardModal() {
  const { activeCardModal, activeCardModalIsMirror, closeCardModal } = useTrelloUI();
  const card = useCard(activeCardModal ?? '');
  const isCardInInbox = useIsCardInInbox(activeCardModal ?? '');

  // Don't render if no active card modal
  if (!activeCardModal || !card) {
    return null;
  }

  // Determine variant and action component based on tracked mirror status
  const variant = activeCardModalIsMirror ? 'mirror' : 'normal';
  const actionComponent = activeCardModalIsMirror ? MirrorCardAction : CardModalAction;

  return (
    <UnifiedCardModal
      cardId={activeCardModal}
      isOpen={true}
      onClose={closeCardModal}
      variant={variant}
      actionComponent={actionComponent}
      actionVariant={isCardInInbox ? 'inbox' : 'normal'}
      headerPrefix={
        activeCardModalIsMirror ? (
          <MirrorCardPrefix cardId={card.id} onClose={closeCardModal} />
        ) : undefined
      }
      wrapper={
        activeCardModalIsMirror
          ? (children) => (
              <div className="rounded-2xl p-2" style={{ backgroundColor: '#0079bf' }}>
                {children}
              </div>
            )
          : undefined
      }
    />
  );
});

export { GlobalCardModal };
