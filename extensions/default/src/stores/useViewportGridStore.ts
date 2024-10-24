import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Identifier for the viewport grid store type.
 */
const PRESENTATION_TYPE_ID = 'viewportGridId';

/**
 * Flag to enable or disable debug mode for the store.
 * Set to `true` to enable zustand devtools.
 */
const DEBUG_STORE = false;

/**
 * Represents the state of the viewport grid.
 */
type ViewportGridState = {
  [key: string]: unknown;
};

/**
 * State shape for the Viewport Grid store.
 */
type ViewportGridStore = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores the viewport grid state as a key-value mapping.
   */
  viewportGridState: ViewportGridState;

  /**
   * Sets the viewport grid state for a given key.
   *
   * @param key - The key to set in the viewport grid state.
   * @param value - The value to associate with the key.
   */
  setViewportGridState: (key: string, value: unknown) => void;

  /**
   * Clears the entire viewport grid state.
   */
  clearViewportGridState: () => void;
};

/**
 * Creates the Viewport Grid store.
 *
 * @param set - The zustand set function.
 * @returns The Viewport Grid store state and actions.
 */
const createViewportGridStore = (set): ViewportGridStore => ({
  type: PRESENTATION_TYPE_ID,
  viewportGridState: {},

  /**
   * Sets the viewport grid state for a given key.
   */
  setViewportGridState: (key, value) =>
    set(
      state => ({
        viewportGridState: {
          ...state.viewportGridState,
          [key]: value,
        },
      }),
      false,
      'setViewportGridState'
    ),

  /**
   * Clears the entire viewport grid state.
   */
  clearViewportGridState: () => set({ viewportGridState: {} }, false, 'clearViewportGridState'),
});

/**
 * Zustand store for managing viewport grid state.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useViewportGridStore = create<ViewportGridStore>()(
  DEBUG_STORE
    ? devtools(createViewportGridStore, { name: 'ViewportGridStore' })
    : createViewportGridStore
);
