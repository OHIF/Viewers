import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LutPresentation } from '../types/Presentation';
import { addUniqueIndex, DEFAULT_STR, JOIN_STR } from './presentationUtils';

/**
 * Identifier for the LUT Presentation store type.
 */
const PRESENTATION_TYPE_ID = 'lutPresentationId';

/**
 * Flag to enable or disable debug mode for the store.
 * Set to `true` to enable zustand devtools.
 */
const DEBUG_STORE = false;

/**
 * Represents the state and actions for managing LUT presentations.
 */
type LutPresentationState = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores LUT presentations indexed by their presentation ID.
   */
  lutPresentationStore: Record<string, LutPresentation>;

  /**
   * Sets the LUT presentation for a given key.
   *
   * @param key - The key identifying the LUT presentation.
   * @param value - The `LutPresentation` to associate with the key.
   */
  setLutPresentation: (key: string, value: LutPresentation) => void;

  /**
   * Clears all LUT presentations from the store.
   */
  clearLutPresentationStore: () => void;

  /**
   * Retrieves the presentation ID based on the provided parameters.
   *
   * @param id - The presentation ID to check.
   * @param options - Configuration options.
   * @param options.viewport - The current viewport in grid
   * @param options.viewports - All available viewports in grid
   * @param options.isUpdatingSameViewport - Indicates if the same viewport is being updated.
   * @returns The presentation ID or undefined.
   */
  getPresentationId: (
    id: string,
    options: {
      viewport: AppTypes.ViewportGrid.Viewport;
      viewports: AppTypes.ViewportGrid.Viewports;
      isUpdatingSameViewport: boolean;
    }
  ) => string | undefined;
};

/**
 * Generates a presentation ID for LUT based on the viewport configuration.
 *
 * @param id - The ID to check.
 * @param options - Configuration options.
 * @param options.viewport - The current viewport.
 * @param options.viewports - All available viewports.
 * @param options.isUpdatingSameViewport - Indicates if the same viewport is being updated.
 * @returns The LUT presentation ID or undefined.
 */
const getLutPresentationId = (
  id: string,
  {
    viewport,
    viewports,
    isUpdatingSameViewport,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    viewports: AppTypes.ViewportGrid.Viewports;
    isUpdatingSameViewport: boolean;
  }
): string | undefined => {
  if (id !== PRESENTATION_TYPE_ID) {
    return;
  }

  const getLutId = (ds): string => {
    if (!ds || !ds.options) {
      return DEFAULT_STR;
    }
    if (ds.options.id) {
      return ds.options.id;
    }
    const arr = Object.entries(ds.options).map(([key, val]) => `${key}=${val}`);
    if (!arr.length) {
      return DEFAULT_STR;
    }
    return arr.join(JOIN_STR);
  };

  if (!viewport || !viewport.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { displaySetOptions, displaySetInstanceUIDs } = viewport;
  const lutId = getLutId(displaySetOptions[0]);
  const lutPresentationArr = [lutId];

  for (const uid of displaySetInstanceUIDs) {
    lutPresentationArr.push(uid);
  }

  addUniqueIndex(lutPresentationArr, PRESENTATION_TYPE_ID, viewports, isUpdatingSameViewport);

  return lutPresentationArr.join(JOIN_STR);
};

/**
 * Creates the LUT Presentation store.
 *
 * @param set - The zustand set function.
 * @returns The LUT Presentation store state and actions.
 */
const createLutPresentationStore = (set): LutPresentationState => ({
  type: PRESENTATION_TYPE_ID,
  lutPresentationStore: {},

  /**
   * Sets the LUT presentation for a given key.
   */
  setLutPresentation: (key, value) =>
    set(
      state => ({
        lutPresentationStore: {
          ...state.lutPresentationStore,
          [key]: value,
        },
      }),
      false,
      'setLutPresentation'
    ),

  /**
   * Clears all LUT presentations from the store.
   */
  clearLutPresentationStore: () =>
    set({ lutPresentationStore: {} }, false, 'clearLutPresentationStore'),

  /**
   * Retrieves the presentation ID based on the provided parameters.
   */
  getPresentationId: getLutPresentationId,
});

/**
 * Zustand store for managing LUT presentations.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useLutPresentationStore = create<LutPresentationState>()(
  DEBUG_STORE
    ? devtools(createLutPresentationStore, { name: 'LutPresentationStore' })
    : createLutPresentationStore
);
