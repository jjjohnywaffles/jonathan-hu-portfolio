import React, { memo } from 'react';
import type { FC } from 'react';
import { IconTemplateCreate } from '../icons/card-modal-action/icon-template-create';
import { Button } from '../ui/Button';
import { FlexContainer } from '../ui/FlexContainer';

type TemplateCardBannerProps = {
  cardId: string;
  onClose?: () => void;
  createTemplateButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenCreateTemplateModal: () => void;
};

const TemplateCardBanner: FC<TemplateCardBannerProps> = memo(function TemplateCardBanner({
  cardId,
  onClose,
  createTemplateButtonRef,
  onOpenCreateTemplateModal,
}) {
  return (
    <div
      className="px-6 py-4"
      style={{ backgroundColor: 'var(--ds-background-information, #E9F2FF)' }}
      data-testid="template-card-back-banner"
    >
      <FlexContainer justify="between" align="center">
        <FlexContainer align="center" gap="2">
          <span className="h-4 w-1 rounded-full bg-blue-500"></span>
          <h1 className="text-base font-semibold text-gray-800">This is a Template card.</h1>
        </FlexContainer>

        <Button
          ref={createTemplateButtonRef}
          onClick={onOpenCreateTemplateModal}
          className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          size="sm"
          data-testid="create-card-from-template-banner-button"
        >
          <IconTemplateCreate className="h-4 w-4 text-white" />
          Create card from template
        </Button>
      </FlexContainer>
    </div>
  );
});

export { TemplateCardBanner };
