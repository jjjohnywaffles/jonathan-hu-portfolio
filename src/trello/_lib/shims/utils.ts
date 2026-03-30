import { type ClassNameValue, twMerge } from 'tailwind-merge';
import { z } from 'zod';

export function cn(...inputs: ClassNameValue[]): string {
  return twMerge(...inputs);
}

export function cnF(...inputs: ClassNameValue[]): string {
  return cn('flex min-h-0 min-w-0', ...inputs);
}

export function nn<T>(value: T | null | undefined, label = 'Value'): NonNullable<T> {
  if (value == null) {
    throw new Error(`${label} is nullish: ${value}`);
  }
  return value as NonNullable<T>;
}

export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty');
export const emailSchema = z.string().email();
