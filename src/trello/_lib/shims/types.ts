import type { Objectish } from 'immer';
import type { ReactNode } from 'react';

// Framework type replacements

export type NextLayout = React.FC<{ children: ReactNode }>;
export type NextPage = React.FC;

export type GetInitialDataParams = {
  dataset?: string;
  self?: string;
  mini?: boolean;
  modifiers?: unknown;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export type OperationDefinitions<S> = Record<string, OperationDefinition<S>>;

export type OperationDefinition<S> = ((state: S) => any) | ((state: S, params: any) => any);

type DropStateParam<F> = F extends (state: any, ...rest: infer P) => infer R
  ? (...args: P) => R
  : never;

export type StripState<OD extends Record<string, (...a: any[]) => any>> = {
  [K in keyof OD]: DropStateParam<OD[K]>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Re-export Objectish for convenience
export type { Objectish };
