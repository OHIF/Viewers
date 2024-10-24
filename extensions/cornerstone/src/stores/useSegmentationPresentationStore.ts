import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SegmentationPresentation } from '../types/Presentation';
import { JOIN_STR } from './presentationUtils';
import { getViewportOrientationFromImageOrientationPatient } from '../utils/getViewportOrientationFromImageOrientationPatient';

/**
 * The keys are the presentationId
 */
type SegmentationPresentationStore = {
  /** Store for managing segmentation presentation state */
  segmentationPresentationStore: Record<string, SegmentationPresentation>;

  /** Sets the presentation state for a given segmentation ID */
  setSegmentationPresentation: (presentationId: string, value: SegmentationPresentation) => void;

  /** Clears all segmentation presentation state */
  clearSegmentationPresentationStore: () => void;

  /**
   * Gets the presentation ID for a viewport based on its configuration
   * @param id - The ID to check
   * @param options - Configuration options
   * @param options.viewport - The current viewport
   * @param options.viewports - All available viewports
   * @param options.isUpdatingSameViewport - Whether updating same viewport
   * @param options.servicesManager - The services manager instance
   * @returns The presentation ID or undefined
   */
  getPresentationId: (
    id: string,
    options: {
      viewport: AppTypes.ViewportGrid.Viewport;
      viewports: AppTypes.ViewportGrid.Viewports;
      isUpdatingSameViewport: boolean;
      servicesManager: AppTypes.ServicesManager;
    }
  ) => string | undefined;

  /**
   * Adds a new segmentation presentation state
   * @param presentationId - The presentation ID
   * @param segmentationPresentation - The presentation state to add
   * @param servicesManager - The services manager instance
   */
  addSegmentationPresentation: (
    presentationId: string,
    segmentationPresentation: SegmentationPresentation,
    { servicesManager }: { servicesManager: AppTypes.ServicesManager }
  ) => void;

  /** Gets the current segmentation presentation ID */
  getSegmentationPresentationId: ({
    viewport,
    servicesManager,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    servicesManager: AppTypes.ServicesManager;
  }) => string;
};

/**
 * Gets the segmentationPresentationId for a viewport.
 * Used for retrieving segmentation information based on:
 * - displaySetOption[0].options (including id if present)
 * - displaySetUIDs
 * - a unique index if the generated key is already displayed
 *
 * @param {string} id - The ID to check
 * @param {Object} options - The options object
 * @param {Object} options.viewport - The current viewport
 * @param {Map} options.viewports - The list of all viewports
 * @returns {string|undefined} The segmentationPresentationId or undefined
 */
const getPresentationId = (
  id: string,
  {
    viewport,
    servicesManager,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    viewports: AppTypes.ViewportGrid.Viewports;
    isUpdatingSameViewport: boolean;
    servicesManager: AppTypes.ServicesManager;
  }
): string | undefined => {
  if (id !== 'segmentationPresentationId') {
    return;
  }

  return _getSegmentationPresentationId({ viewport, servicesManager });
};

const _getSegmentationPresentationId = ({
  viewport,
  servicesManager,
}: {
  viewport: AppTypes.ViewportGrid.Viewport;
  servicesManager: AppTypes.ServicesManager;
}) => {
  if (!viewport?.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { displaySetInstanceUIDs, viewportOptions } = viewport;

  let orientation = viewportOptions.orientation;

  if (!orientation) {
    // calculate it from the viewport sample image
    const displaySet = servicesManager.services.displaySetService.getDisplaySetByUID(
      displaySetInstanceUIDs[0]
    );
    const sampleImage = displaySet.images?.[0];
    const imageOrientationPatient = sampleImage?.ImageOrientationPatient;

    orientation = getViewportOrientationFromImageOrientationPatient(imageOrientationPatient);
  }

  // const segmentationPresentationArr = [orientation || 'acquisition'];
  const segmentationPresentationArr = [];

  segmentationPresentationArr.push(...displaySetInstanceUIDs);
  // Probably we don't need this for segmentation presentation id since we want
  // the segmentation to appear on all the viewports with the same displayset i guess?

  // addUniqueIndex(
  //   segmentationPresentationArr,
  //   'segmentationPresentationId',
  //   viewports,
  //   isUpdatingSameViewport
  // );

  return segmentationPresentationArr.join(JOIN_STR);
};

// Stores a map from `segmentationPresentationId` to a Presentation object so that
// an OHIFCornerstoneViewport can be redisplayed with the same Segmentation
export const useSegmentationPresentationStore = create<SegmentationPresentationStore>()(
  devtools(
    set => ({
      segmentationPresentationStore: {},
      clearSegmentationPresentationStore: () =>
        set({ segmentationPresentationStore: {} }, false, 'clearSegmentationPresentationStore'),
      addSegmentationPresentation: (
        presentationId: string,
        segmentationPresentation: SegmentationPresentation,
        { servicesManager }: { servicesManager: AppTypes.ServicesManager }
      ) =>
        set(
          state => ({
            segmentationPresentationStore: {
              ...state.segmentationPresentationStore,
              [presentationId]: segmentationPresentation,
            },
          }),
          false,
          'addSegmentationPresentation'
        ),
      setSegmentationPresentation: (presentationId: string, value: SegmentationPresentation) =>
        set(
          state => {
            return {
              segmentationPresentationStore: {
                ...state.segmentationPresentationStore,
                [presentationId]: value,
              },
            };
          },
          false,
          'setSegmentationPresentation'
        ),
      getPresentationId,
      getSegmentationPresentationId: _getSegmentationPresentationId,
    }),
    {
      name: 'Segmentation Presentation Store',
    }
  )
);
