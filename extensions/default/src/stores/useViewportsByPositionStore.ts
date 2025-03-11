import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const PRESENTATION_TYPE_ID = 'viewportsByPositionId';
const DEBUG_STORE = false;

/**
 * Represents the state and actions for managing viewports by position.
 */
type ViewportsByPositionState = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores viewports indexed by their position.
   */
  viewportsByPosition: Record<string, unknown>;

  /**
   * Stores initial display viewports as an array of strings.
   */
  initialInDisplay: string[];

  /**
   * Sets the viewport for a given key.
   *
   * @param key - The key identifying the viewport position.
   * @param value - The viewport data to associate with the key.
   */
  setViewportsByPosition: (key: string, value: unknown) => void;

  /**
   * Clears all viewports by position.
   */
  clearViewportsByPosition: () => void;

  /**
   * Adds an initial display viewport.
   *
   * @param value - The viewport identifier to add.
   */
  addInitialInDisplay: (value: string) => void;
};

/**
 * Creates the Viewports By Position store.
 *
 * @param set - The zustand set function.
 * @returns The Viewports By Position store state and actions.
 */
const createViewportsByPositionStore = (set): ViewportsByPositionState => ({
  type: PRESENTATION_TYPE_ID,
  viewportsByPosition: {},
  initialInDisplay: [],

  /**
   * Sets the viewport for a given key.
   */
  setViewportsByPosition: (key, value) =>
    set(
      state => ({
        viewportsByPosition: {
          ...state.viewportsByPosition,
          [key]: value,
        },
      }),
      false,
      'setViewportsByPosition'
    ),

  /**
   * Clears all viewports by position.
   */
  clearViewportsByPosition: () =>
    set({ viewportsByPosition: {} }, false, 'clearViewportsByPosition'),

  /**
   * Adds an initial display viewport.
   */
  addInitialInDisplay: value =>
    set(
      state => ({
        initialInDisplay: [...state.initialInDisplay, value],
      }),
      false,
      'addInitialInDisplay'
    ),
});

/**
 * Zustand store for managing viewports by position.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useViewportsByPositionStore = create<ViewportsByPositionState>()(
  DEBUG_STORE
    ? devtools(createViewportsByPositionStore, { name: 'ViewportsByPositionStore' })
    : createViewportsByPositionStore
);
