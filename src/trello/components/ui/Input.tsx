// Unified input component supporting both text inputs and textareas with consistent focus states and validation styling
import React, { memo, forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@trello/_lib/shims/utils';

type InputProps = {
  variant?: 'default' | 'textarea';
  className?: string;
} & (
  | (InputHTMLAttributes<HTMLInputElement> & { variant?: 'default' })
  | (React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      variant: 'textarea';
    })
);

const Input = memo(
  forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(function Input(
    { variant = 'default', className, ...props },
    ref
  ) {
    const baseClasses =
      'w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors';

    const variantClasses = {
      default: 'rounded-sm',
      textarea: 'rounded-md resize-none',
    };

    if (variant === 'textarea') {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          className={cn(baseClasses, variantClasses.textarea, className)}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      );
    }

    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        className={cn(baseClasses, variantClasses.default, className)}
        {...(props as InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  })
);

export { Input };
