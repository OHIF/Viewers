import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Identifier for the UI State store type.
 */
const PRESENTATION_TYPE_ID = 'uiStateId';

/**
 * Flag to enable or disable debug mode for the store.
 * Set to `true` to enable zustand devtools.
 */
const DEBUG_STORE = false;

/**
 * Represents the UI state.
 */
type UIState = {
  [key: string]: unknown;
};

/**
 * State shape for the UI State store.
 */
type UIStateStore = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores the UI state as a key-value mapping.
   */
  uiState: UIState;

  /**
   * Sets the UI state for a given key.
   *
   * @param key - The key to set in the UI state.
   * @param value - The value to associate with the key.
   */
  setUIState: (key: string, value: unknown) => void;

  /**
   * Clears all UI state.
   */
  clearUIState: () => void;
};

/**
 * Creates the UI State store.
 *
 * @param set - The zustand set function.
 * @returns The UI State store state and actions.
 */
const createUIStateStore = (set): UIStateStore => ({
  type: PRESENTATION_TYPE_ID,
  uiState: {},

  /**
   * Sets the UI state for a given key.
   */
  setUIState: (key, value) =>
    set(
      state => ({
        uiState: {
          ...state.uiState,
          [key]: value,
        },
      }),
      false,
      'setUIState'
    ),

  /**
   * Clears all UI state.
   */
  clearUIState: () => set({ uiState: {} }, false, 'clearUIState'),
});

/**
 * Zustand store for managing UI state.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useUIStateStore = create<UIStateStore>()(
  DEBUG_STORE ? devtools(createUIStateStore, { name: 'UIStateStore' }) : createUIStateStore
);
