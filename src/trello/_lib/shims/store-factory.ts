import { produce, type Objectish } from 'immer';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { OperationDefinitions, StripState } from './types';

export type ZustandStore<T> = UseBoundStore<StoreApi<T>>;

export type StoreState<Data extends Objectish, OpDefs extends OperationDefinitions<Data>> = {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  saving: boolean;
} & Data &
  StripState<OpDefs>;

export type SyncedMockBackendStore<
  Data extends Objectish,
  OpDefs extends OperationDefinitions<Data>,
> = {
  store: ZustandStore<StoreState<Data, OpDefs>>;
  initialize: () => Promise<void>;
  clearEventLog: () => void;
};

export function createSyncedMockBackendStore<
  Data extends Objectish,
  OpDefs extends OperationDefinitions<Data>,
>(
  _site: string,
  getInitialData: () => Promise<Data>,
  operationDefinitions: OpDefs
): SyncedMockBackendStore<Data, OpDefs> {
  const store = create<StoreState<Data, OpDefs>>((set) => {
    const callableOperations = Object.fromEntries(
      Object.entries(operationDefinitions).map(([key, opDef]) => [
        key,
        (params: object | undefined) => {
          let returnValue: unknown;

          set((state) => {
            if (state.status !== 'loaded') return state;

            const nextState = produce(state, (draft) => {
              returnValue = (opDef as (s: Data, p?: object) => unknown)(
                draft as unknown as Data,
                params
              );
            });

            return nextState;
          });

          return returnValue;
        },
      ])
    ) as StripState<OpDefs>;

    return {
      status: 'idle',
      saving: false,
      ...callableOperations,
    } as StoreState<Data, OpDefs>;
  });

  async function initializeStore(): Promise<void> {
    if (store.getState().status !== 'idle') return;

    store.setState({ status: 'loading' } as unknown as Partial<StoreState<Data, OpDefs>>);

    try {
      const data = await getInitialData();
      store.setState({
        status: 'loaded',
        ...data,
      } as unknown as Partial<StoreState<Data, OpDefs>>);
    } catch (err) {
      console.error('Failed to initialize store:', err);
      store.setState({ status: 'error' } as unknown as Partial<StoreState<Data, OpDefs>>);
    }
  }

  return { store, initialize: initializeStore, clearEventLog: () => {} };
}
