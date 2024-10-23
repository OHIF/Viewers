import { create } from 'zustand';
import { PositionPresentation } from '../types/Presentation';
import { addUniqueIndex, JOIN_STR } from './presentationUtils';

type PositionPresentationState = {
  positionPresentationStore: Record<string, PositionPresentation>;
  setPositionPresentation: (key: string, value: PositionPresentation) => void;
  clearPositionPresentationStore: () => void;
  getPresentationId: (
    id: string,
    options: {
      viewport: any;
      viewports: any;
      isUpdatingSameViewport: boolean;
    }
  ) => string | undefined;
};

/**
 * Gets the positionPresentationId for a viewport.
 * Used for retrieving camera/initial position state sync values based on:
 * - viewportOptions.id
 * - viewportOptions.orientation
 * - display set UIDs (excluding segmentations)
 * - a unique index if the generated key is already displayed
 *
 * @param {string} id - The ID to check
 * @param {Object} options - The options object
 * @param {Object} options.viewport - The current viewport
 * @param {Map} options.viewports - The list of all viewports
 * @returns {string|undefined} The positionPresentationId or undefined
 */
const getPositionPresentationId = (
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
  if (id !== 'positionPresentationId') {
    return;
  }

  if (!viewport?.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { viewportOptions, displaySetInstanceUIDs, displaySetOptions } = viewport;
  const { id: viewportOptionId, orientation } = viewportOptions;

  const positionPresentationArr = [orientation || 'acquisition'];
  if (viewportOptionId) {
    positionPresentationArr.push(viewportOptionId);
  }

  if (displaySetOptions.some(ds => ds.options?.blendMode || ds.options?.displayPreset)) {
    positionPresentationArr.push(`custom`);
  }

  for (const uid of displaySetInstanceUIDs) {
    positionPresentationArr.push(uid);
  }

  addUniqueIndex(
    positionPresentationArr,
    'positionPresentationId',
    viewports,
    isUpdatingSameViewport
  );

  return positionPresentationArr.join(JOIN_STR);
};

// Stores a map from `positionPresentationId` to a Presentation object so that
// an OHIFCornerstoneViewport can be redisplayed with the same position
export const usePositionPresentationStore = create<PositionPresentationState>(set => ({
  positionPresentationStore: {},
  setPositionPresentation: (key, value) =>
    set(state => ({
      positionPresentationStore: {
        ...state.positionPresentationStore,
        [key]: value,
      },
    })),
  clearPositionPresentationStore: () => set({ positionPresentationStore: {} }),
  getPresentationId: getPositionPresentationId,
}));
