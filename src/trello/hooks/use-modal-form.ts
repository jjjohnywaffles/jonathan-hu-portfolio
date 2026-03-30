// Reusable hook for modal form state management with auto-reset on close and validation
import { useState, useEffect, useCallback, useRef } from 'react';

type UseModalFormOptions<T> = {
  isOpen: boolean;
  initialValues: T;
  onSubmit: (values: T) => void;
  validate?: (values: T) => boolean;
  resetOnClose?: boolean;
};

export function useModalForm<T extends Record<string, any>>({
  isOpen,
  initialValues,
  onSubmit,
  validate,
  resetOnClose = true,
}: UseModalFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const prevInitialValuesRef = useRef<T>(initialValues);

  // Reset form when modal closes (if enabled)
  useEffect(() => {
    if (!isOpen && resetOnClose) {
      setValues(initialValues);
      setErrors({});
    }
  }, [isOpen, resetOnClose, initialValues]);

  // Sync values when initial values change (only if they actually changed)
  useEffect(() => {
    if (JSON.stringify(prevInitialValuesRef.current) !== JSON.stringify(initialValues)) {
      setValues(initialValues);
      prevInitialValuesRef.current = initialValues;
    }
  }, [initialValues]);

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      // Clear error for this field when user starts editing
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors]
  );

  const setError = useCallback(<K extends keyof T>(key: K, error: string) => {
    setErrors((prev) => ({ ...prev, [key]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      // Run validation if provided
      if (validate && !validate(values)) {
        return false;
      }

      onSubmit(values);
      return true;
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    isValid: validate ? validate(values) : true,
  };
}
