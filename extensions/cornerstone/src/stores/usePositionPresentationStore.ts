import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PositionPresentation } from '../types/Presentation';
import { addUniqueIndex, JOIN_STR } from './presentationUtils';

const PRESENTATION_TYPE_ID = 'positionPresentationId';
const DEBUG_STORE = false;

/**
 * Represents the state and actions for managing position presentations.
 */
type PositionPresentationState = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores position presentations indexed by their presentation ID.
   */
  positionPresentationStore: Record<string, PositionPresentation>;

  /**
   * Sets the position presentation for a given key.
   *
   * @param key - The key identifying the position presentation.
   * @param value - The `PositionPresentation` to associate with the key.
   */
  setPositionPresentation: (key: string, value: PositionPresentation) => void;

  /**
   * Clears all position presentations from the store.
   */
  clearPositionPresentationStore: () => void;

  /**
   * Retrieves the presentation ID based on the provided parameters.
   *
   * @param id - The ID to check.
   * @param options - Configuration options.
   * @param options.viewport - The current viewport.
   * @param options.viewports - All available viewports.
   * @param options.isUpdatingSameViewport - Indicates if the same viewport is being updated.
   * @returns The position presentation ID or undefined.
   */
  getPresentationId: (
    id: string,
    options: {
      viewport: any;
      viewports: any;
      isUpdatingSameViewport: boolean;
    }
  ) => string | undefined;

  getPositionPresentationId: (
    viewport: any,
    viewports?: any,
    isUpdatingSameViewport?: boolean
  ) => string | undefined;
};

/**
 * Generates a position presentation ID based on the viewport configuration.
 *
 * @param id - The ID to check.
 * @param options - Configuration options.
 * @param options.viewport - The current viewport.
 * @param options.viewports - All available viewports.
 * @param options.isUpdatingSameViewport - Indicates if the same viewport is being updated.
 * @returns The position presentation ID or undefined.
 */
const getPresentationId = (
  id: string,
  {
    viewport,
    viewports,
    isUpdatingSameViewport,
  }: {
    viewport: any;
    viewports: any;
    isUpdatingSameViewport: boolean;
  }
): string | undefined => {
  if (id !== PRESENTATION_TYPE_ID) {
    return;
  }

  if (!viewport?.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  return getPositionPresentationId(viewport, viewports, isUpdatingSameViewport);
};

function getPositionPresentationId(viewport, viewports, isUpdatingSameViewport) {
  const { viewportOptions = {}, displaySetInstanceUIDs = [], displaySetOptions = [] } = viewport;
  const { id: viewportOptionId, orientation } = viewportOptions;

  const positionPresentationArr = [orientation || 'acquisition'];
  if (viewportOptionId) {
    positionPresentationArr.push(viewportOptionId);
  }

  if (displaySetOptions?.some(ds => ds.options?.blendMode || ds.options?.displayPreset)) {
    positionPresentationArr.push(`custom`);
  }

  for (const uid of displaySetInstanceUIDs) {
    positionPresentationArr.push(uid);
  }

  if (viewports && viewports.length && isUpdatingSameViewport !== undefined) {
    addUniqueIndex(
      positionPresentationArr,
      PRESENTATION_TYPE_ID,
      viewports,
      isUpdatingSameViewport
    );
  } else {
    positionPresentationArr.push(0);
  }

  return positionPresentationArr.join(JOIN_STR);
}

/**
 * Creates the Position Presentation store.
 *
 * @param set - The zustand set function.
 * @returns The Position Presentation store state and actions.
 */
const createPositionPresentationStore = set => ({
  type: PRESENTATION_TYPE_ID,
  positionPresentationStore: {},

  /**
   * Sets the position presentation for a given key.
   */
  setPositionPresentation: (key, value) =>
    set(
      state => ({
        positionPresentationStore: {
          ...state.positionPresentationStore,
          [key]: value,
        },
      }),
      false,
      'setPositionPresentation'
    ),

  /**
   * Clears all position presentations from the store.
   */
  clearPositionPresentationStore: () =>
    set({ positionPresentationStore: {} }, false, 'clearPositionPresentationStore'),

  /**
   * Retrieves the presentation ID based on the provided parameters.
   */
  getPresentationId,
  getPositionPresentationId: getPositionPresentationId,
});

/**
 * Zustand store for managing position presentations.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const usePositionPresentationStore = create<PositionPresentationState>()(
  DEBUG_STORE
    ? devtools(createPositionPresentationStore, { name: 'PositionPresentationStore' })
    : createPositionPresentationStore
);
