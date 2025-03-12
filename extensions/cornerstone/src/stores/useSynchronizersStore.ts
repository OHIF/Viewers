import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Identifier for the synchronizers store type.
 */
const PRESENTATION_TYPE_ID = 'synchronizersStoreId';

/**
 * Flag to enable or disable debug mode for the store.
 * Set to `true` to enable zustand devtools.
 */
const DEBUG_STORE = false;

/**
 * Information about a single synchronizer.
 */
type SynchronizerInfo = {
  id: string;
  type: string;
  sourceViewports: Array<{ viewportId: string; renderingEngineId: string }>;
  targetViewports: Array<{ viewportId: string; renderingEngineId: string }>;
};

/**
 * State shape for the Synchronizers store.
 */
type SynchronizersState = {
  /**
   * Stores synchronizer information indexed by a unique key.
   */
  synchronizersStore: Record<string, SynchronizerInfo[]>;

  /**
   * Sets the synchronizers for a specific viewport.
   *
   * @param viewportId - The ID of the viewport.
   * @param synchronizers - An array of SynchronizerInfo.
   */
  setSynchronizers: (viewportId: string, synchronizers: SynchronizerInfo[]) => void;

  /**
   * Clears the entire synchronizers store.
   */
  clearSynchronizersStore: () => void;
};

/**
 * Creates the Synchronizers store.
 *
 * @param set - The zustand set function.
 * @returns The synchronizers store state and actions.
 */
const createSynchronizersStore = (set): SynchronizersState => ({
  synchronizersStore: {},
  type: PRESENTATION_TYPE_ID,

  setSynchronizers: (viewportId: string, synchronizers: SynchronizerInfo[]) => {
    set(
      state => ({
        synchronizersStore: {
          ...state.synchronizersStore,
          [viewportId]: synchronizers,
        },
      }),
      false,
      'setSynchronizers'
    );
  },

  clearSynchronizersStore: () => {
    set({ synchronizersStore: {} }, false, 'clearSynchronizersStore');
  },
});

/**
 * Zustand store for managing synchronizers.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useSynchronizersStore = create<SynchronizersState>()(
  DEBUG_STORE
    ? devtools(createSynchronizersStore, { name: 'SynchronizersStore' })
    : createSynchronizersStore
);
