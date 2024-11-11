import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SegmentationPresentation, SegmentationPresentationItem } from '../types/Presentation';
import { JOIN_STR } from './presentationUtils';
import { getViewportOrientationFromImageOrientationPatient } from '../utils/getViewportOrientationFromImageOrientationPatient';

const PRESENTATION_TYPE_ID = 'segmentationPresentationId';
const DEBUG_STORE = false;

/**
 * The keys are the presentationId.
 */
type SegmentationPresentationStore = {
  /**
   * Type identifier for the store.
   */
  type: string;

  /**
   * Stores segmentation presentations indexed by their presentation ID.
   */
  segmentationPresentationStore: Record<string, SegmentationPresentation>;

  /**
   * Sets the segmentation presentation for a given segmentation ID.
   *
   * @param presentationId - The presentation ID.
   * @param value - The `SegmentationPresentation` to associate with the ID.
   */
  setSegmentationPresentation: (presentationId: string, value: SegmentationPresentation) => void;

  /**
   * Clears all segmentation presentations from the store.
   */
  clearSegmentationPresentationStore: () => void;

  /**
   * Retrieves the presentation ID based on the provided parameters.
   *
   * @param id - The ID to check.
   * @param options - Configuration options.
   * @param options.viewport - The current viewport.
   * @param options.viewports - All available viewports.
   * @param options.isUpdatingSameViewport - Indicates if the same viewport is being updated.
   * @param options.servicesManager - The services manager instance.
   * @returns The segmentation presentation ID or undefined.
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
   * Adds a new segmentation presentation state.
   *
   * @param presentationId - The presentation ID.
   * @param segmentationPresentation - The `SegmentationPresentation` to add.
   * @param servicesManager - The services manager instance.
   */
  addSegmentationPresentationItem: (
    presentationId: string,
    segmentationPresentationItem: SegmentationPresentationItem
  ) => void;

  /**
   * Gets the current segmentation presentation ID.
   *
   * @param params - Parameters for retrieving the segmentation presentation ID.
   * @param params.viewport - The current viewport.
   * @param params.servicesManager - The services manager instance.
   * @returns The current segmentation presentation ID.
   */
  getSegmentationPresentationId: ({
    viewport,
    servicesManager,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    servicesManager: AppTypes.ServicesManager;
  }) => string;
};

/**
 * Generates a segmentation presentation ID based on the viewport configuration.
 *
 * @param id - The ID to check.
 * @param options - Configuration options.
 * @param options.viewport - The current viewport.
 * @param options.viewports - All available viewports.
 * @param options.isUpdatingSameViewport - Indicates if the same viewport is being updated.
 * @param options.servicesManager - The services manager instance.
 * @returns The segmentation presentation ID or undefined.
 */
const getPresentationId = (
  id: string,
  {
    viewport,
    viewports,
    isUpdatingSameViewport,
    servicesManager,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    viewports: AppTypes.ViewportGrid.Viewports;
    isUpdatingSameViewport: boolean;
    servicesManager: AppTypes.ServicesManager;
  }
): string | undefined => {
  if (id !== PRESENTATION_TYPE_ID) {
    return;
  }

  return _getSegmentationPresentationId({ viewport, servicesManager });
};

/**
 * Helper function to generate the segmentation presentation ID.
 *
 * @param params - Parameters for generating the segmentation presentation ID.
 * @param params.viewport - The current viewport.
 * @param params.servicesManager - The services manager instance.
 * @returns The segmentation presentation ID or undefined.
 */
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
    // Calculate orientation from the viewport sample image
    const displaySet = servicesManager.services.displaySetService.getDisplaySetByUID(
      displaySetInstanceUIDs[0]
    );
    const sampleImage = displaySet.images?.[0];
    const imageOrientationPatient = sampleImage?.ImageOrientationPatient;

    orientation = getViewportOrientationFromImageOrientationPatient(imageOrientationPatient);
  }

  const segmentationPresentationArr = [];

  segmentationPresentationArr.push(...displaySetInstanceUIDs);

  // Uncomment if unique indexing is needed
  // addUniqueIndex(
  //   segmentationPresentationArr,
  //   'segmentationPresentationId',
  //   viewports,
  //   isUpdatingSameViewport
  // );

  return segmentationPresentationArr.join(JOIN_STR);
};

/**
 * Creates the Segmentation Presentation store.
 *
 * @param set - The zustand set function.
 * @returns The Segmentation Presentation store state and actions.
 */
const createSegmentationPresentationStore = set => ({
  type: PRESENTATION_TYPE_ID,
  segmentationPresentationStore: {},

  /**
   * Clears all segmentation presentations from the store.
   */
  clearSegmentationPresentationStore: () =>
    set({ segmentationPresentationStore: {} }, false, 'clearSegmentationPresentationStore'),

  /**
   * Adds a new segmentation presentation item to the store.
   *
   * segmentationPresentationItem: {
   *   segmentationId: string;
   *   type: SegmentationRepresentations;
   *   hydrated: boolean | null;
   *   config?: unknown;
   * }
   */
  addSegmentationPresentationItem: (
    presentationId: string,
    segmentationPresentationItem: SegmentationPresentationItem
  ) =>
    set(
      state => ({
        segmentationPresentationStore: {
          ...state.segmentationPresentationStore,
          [presentationId]: [
            ...(state.segmentationPresentationStore[presentationId] || []),
            segmentationPresentationItem,
          ],
        },
      }),
      false,
      'addSegmentationPresentationItem'
    ),

  /**
   * Sets the segmentation presentation for a given presentation ID. A segmentation
   * presentation is an array of SegmentationPresentationItem.
   *
   * segmentationPresentationItem: {
   *   segmentationId: string;
   *   type: SegmentationRepresentations;
   *   hydrated: boolean | null;
   *   config?: unknown;
   * }
   *
   * segmentationPresentation: SegmentationPresentationItem[]
   */
  setSegmentationPresentation: (presentationId: string, values: SegmentationPresentation) =>
    set(
      state => ({
        segmentationPresentationStore: {
          ...state.segmentationPresentationStore,
          [presentationId]: values,
        },
      }),
      false,
      'setSegmentationPresentation'
    ),

  /**
   * Retrieves the presentation ID based on the provided parameters.
   */
  getPresentationId,

  /**
   * Retrieves the current segmentation presentation ID.
   */
  getSegmentationPresentationId: _getSegmentationPresentationId,
});

/**
 * Zustand store for managing segmentation presentations.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useSegmentationPresentationStore = create<SegmentationPresentationStore>()(
  DEBUG_STORE
    ? devtools(createSegmentationPresentationStore, { name: 'Segmentation Presentation Store' })
    : createSegmentationPresentationStore
);
