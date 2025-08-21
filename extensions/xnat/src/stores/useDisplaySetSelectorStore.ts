import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Identifier for the display set selector store type.
 */
const PRESENTATION_TYPE_ID = 'displaySetSelectorId';

/**
 * Flag to enable or disable debug mode for the store.
 * Set to `true` to enable zustand devtools.
 */
const DEBUG_STORE = false;

/**
 * State shape for the Display Set Selector store.
 */
type DisplaySetSelectorState = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores a mapping from `<activeStudyUID>:<displaySetSelectorId>:<matchOffset>` to `displaySetInstanceUID[]`.
   * The values are arrays of display set instance UIDs to support multiple display sets per selector.
   */
  displaySetSelectorMap: Record<string, Array<string>>;

  /**
   * Sets the display set selector for a given key.
   *
   * @param key - The key.
   * @param value - The array of `displaySetInstanceUID`s to associate with the key.
   */
  setDisplaySetSelector: (key: string, value: Array<string>) => void;

  /**
   * Adds a display set instance UID to the array for a given key.
   * If the key doesn't exist, it creates a new array with the value.
   *
   * @param key - The key.
   * @param value - The `displaySetInstanceUID` to add to the array.
   */
  addDisplaySetSelector: (key: string, value: string) => void;

  /**
   * Clears the entire display set selector map.
   */
  clearDisplaySetSelectorMap: () => void;
};

/**
 * Creates the Display Set Selector store.
 *
 * @param set - The zustand set function.
 * @returns The display set selector store state and actions.
 */
const createDisplaySetSelectorStore = (set): DisplaySetSelectorState => ({
  type: PRESENTATION_TYPE_ID,
  displaySetSelectorMap: {},

  /**
   * Sets the display set selector for a given key.
   *
   * @param key - The key.
   * @param value - The array of `displaySetInstanceUID`s to associate with the key.
   */
  setDisplaySetSelector: (key: string, value: Array<string>) =>
    set(
      state => ({
        displaySetSelectorMap: {
          ...state.displaySetSelectorMap,
          [key]: value,
        },
      }),
      false,
      'setDisplaySetSelector'
    ),

  /**
   * Adds a display set instance UID to the array for a given key.
   * If the key doesn't exist, it creates a new array with the value.
   *
   * @param key - The key.
   * @param value - The `displaySetInstanceUID` to add to the array.
   */
  addDisplaySetSelector: (key: string, value: string) =>
    set(
      state => ({
        displaySetSelectorMap: {
          ...state.displaySetSelectorMap,
          [key]: [...(state.displaySetSelectorMap[key] || []), value],
        },
      }),
      false,
      'addDisplaySetSelector'
    ),

  /**
   * Clears the entire display set selector map.
   */
  clearDisplaySetSelectorMap: () =>
    set({ displaySetSelectorMap: {} }, false, 'clearDisplaySetSelectorMap'),
});

/**
 * Zustand store for managing display set selectors.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useDisplaySetSelectorStore = create<DisplaySetSelectorState>()(
  DEBUG_STORE
    ? devtools(createDisplaySetSelectorStore, { name: 'DisplaySetSelectorStore' })
    : createDisplaySetSelectorStore
);
