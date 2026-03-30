import React, { memo } from 'react';
import type { FC } from 'react';
import { X } from 'lucide-react';
import { IconChevronLeft } from '../icons/board/icon-chevron-left';

type ModalBackHeaderProps = {
  title: string;
  onBack: () => void;
  onClose?: () => void;
};

const ModalBackHeader: FC<ModalBackHeaderProps> = memo(function ModalBackHeader({
  title,
  onBack,
  onClose,
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <button
        onClick={onBack}
        className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-100"
        title="Back"
      >
        <IconChevronLeft className="h-4 w-4 text-gray-600" />
      </button>
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {onClose ? (
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-100"
          title="Close"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      ) : (
        <div className="h-6 w-6" />
      )}
    </div>
  );
});

export { ModalBackHeader };
