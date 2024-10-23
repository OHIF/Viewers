import { create } from 'zustand';

type SynchronizerInfo = {
  id: string;
  sourceViewports: Array<{ viewportId: string; renderingEngineId: string }>;
  targetViewports: Array<{ viewportId: string; renderingEngineId: string }>;
};

type SynchronizersState = {
  synchronizersStore: Record<string, SynchronizerInfo[]>;
  setSynchronizers: (viewportId: string, synchronizers: SynchronizerInfo[]) => void;
  clearSynchronizersStore: () => void;
};

// Stores synchronizers state to be restored
export const useSynchronizersStore = create<SynchronizersState>(set => ({
  synchronizersStore: {},
  setSynchronizers: (viewportId, synchronizers) =>
    set(state => ({
      synchronizersStore: {
        ...state.synchronizersStore,
        [viewportId]: synchronizers,
      },
    })),
  clearSynchronizersStore: () => set({ synchronizersStore: {} }),
}));
