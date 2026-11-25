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
   * Adds or replaces a segmentation presentation item.
   *
   * Items are identified by their `segmentationId`: an existing entry for the
   * same segmentation is replaced rather than appended.  Appending would let
   * hydrate -> remove -> hydrate accumulate duplicate entries for one
   * segmentation, and the viewport applies every entry, so the same
   * representation would be added more than once.
   *
   * @param presentationId - The presentation ID.
   * @param segmentationPresentationItem - The item to add or replace.
   */
  addSegmentationPresentationItem: (
    presentationId: string,
    segmentationPresentationItem: SegmentationPresentationItem
  ) => void;

  /**
   * Updates the recorded hydration of one segmentation in every presentation
   * that already holds an entry for it, creating none.
   *
   * The store is keyed by the display set a segmentation is hydrated against,
   * so a segmentation with no referenced display set - one drawn in the client -
   * has no key of its own to be written under. It is still recorded, under the
   * key of whatever viewport it was drawn in (see `_getInitialHydrationForSync`
   * in CornerstoneViewportService), and nothing supersedes that record on its
   * own - `syncSegmentationPresentation` only ever merges. So a removal
   * converges the store by rewriting the entries that exist, rather than
   * inventing a key that every such segmentation would collide under.
   *
   * @param segmentationId - The segmentation to restate.
   * @param value.hydrated - The hydration to record for it.
   * @param value.type - The representation type, if the caller knows it;
   *   otherwise each entry keeps the type it has.
   */
  setHydrationForSegmentation: (
    segmentationId: string,
    value: { hydrated: boolean | null; type?: SegmentationPresentationItem['type'] }
  ) => void;

  /**
   * Records the representations a viewport is currently rendering, without
   * changing hydration.
   *
   * `hydrated` is display-set-global ("show this wherever it logically
   * belongs") and is owned by the hydration paths, which write it through
   * `addSegmentationPresentationItem`. A viewport's live representations are
   * not: a segmentation added from the viewport data overlay menu is meant for
   * that one pane, and the presentation id is shared by every pane over the
   * same background. So for a segmentation the store already knows about this
   * keeps the recorded `hydrated` and only refreshes `type`/`config`; the
   * caller's `hydrated` applies only to a segmentation with no entry yet.
   *
   * Entries the viewport is not rendering are kept as they are - a pane that
   * was gated out of automatic hydration, or one the user removed the overlay
   * from, must not erase the record the other panes resolve against.
   *
   * @param presentationId - The presentation ID.
   * @param items - One item per representation the viewport renders.
   */
  syncSegmentationPresentation: (presentationId: string, items: SegmentationPresentation) => void;

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

  const { displaySetService } = servicesManager.services;
  const { displaySetInstanceUIDs, viewportOptions } = viewport;

  // Match keys used by updateStoredSegmentationPresentation (referenced volume only).
  // Including overlay UIDs (e.g. SEG) produced ids like "MR&SEG" while the store
  // entry is under "MR", so hydrated segmentations never applied and viewports could mis-render.
  const nonOverlayUIDs = displaySetInstanceUIDs.filter(uid => {
    const ds = displaySetService.getDisplaySetByUID(uid);
    return ds && !ds.isOverlayDisplaySet;
  });

  if (!nonOverlayUIDs.length) {
    return;
  }

  let orientation = viewportOptions.orientation;

  if (!orientation) {
    // Calculate orientation from the viewport sample image
    const displaySet = displaySetService.getDisplaySetByUID(nonOverlayUIDs[0]);
    const sampleImage = displaySet?.images?.[0];
    const imageOrientationPatient = sampleImage?.ImageOrientationPatient;

    orientation = getViewportOrientationFromImageOrientationPatient(imageOrientationPatient);
  }

  const segmentationPresentationArr = [];

  // Keyed by the exact display set UIDs. Two display sets can share a frame of
  // reference while being unrelated series, so the frame of reference is not
  // usable as a key - which viewports a hydrated segmentation belongs in is a
  // relation, resolved at read time by getViewportPresentations rather than
  // encoded here.
  segmentationPresentationArr.push(...nonOverlayUIDs);

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
   * Adds a new segmentation presentation item to the store, replacing any
   * existing item for the same segmentation.
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
      state => {
        const existingItems = state.segmentationPresentationStore[presentationId] || [];

        // Upsert by segmentationId: the store records the desired state of a
        // segmentation for this presentation, so there is exactly one entry per
        // segmentation and a later write (hydrate, or remove-from-viewport)
        // supersedes an earlier one.
        const otherItems = existingItems.filter(
          item => item.segmentationId !== segmentationPresentationItem.segmentationId
        );

        return {
          segmentationPresentationStore: {
            ...state.segmentationPresentationStore,
            [presentationId]: [...otherItems, segmentationPresentationItem],
          },
        };
      },
      false,
      'addSegmentationPresentationItem'
    ),

  /**
   * Restates the hydration of a segmentation wherever it is already recorded.
   * See the type declaration for why this updates in place instead of writing
   * an entry of its own.
   */
  setHydrationForSegmentation: (
    segmentationId: string,
    { hydrated, type }: { hydrated: boolean | null; type?: SegmentationPresentationItem['type'] }
  ) =>
    set(
      state => {
        const updated: Record<string, SegmentationPresentation> = {};
        const entries = Object.entries(state.segmentationPresentationStore) as [
          string,
          SegmentationPresentation,
        ][];

        for (const [presentationId, items] of entries) {
          if (!items?.some(item => item.segmentationId === segmentationId)) {
            continue;
          }

          updated[presentationId] = items.map(item =>
            item.segmentationId === segmentationId
              ? { ...item, hydrated, type: type ?? item.type }
              : item
          );
        }

        // Nothing recorded for this segmentation is not something to state, and
        // returning the state unchanged leaves subscribers alone.
        if (!Object.keys(updated).length) {
          return state;
        }

        return {
          segmentationPresentationStore: { ...state.segmentationPresentationStore, ...updated },
        };
      },
      false,
      'setHydrationForSegmentation'
    ),

  /**
   * Records the representations a viewport is currently rendering, keeping the
   * hydration already recorded for each of them. See the type declaration for
   * why hydration is not the viewport's to state.
   */
  syncSegmentationPresentation: (presentationId: string, items: SegmentationPresentation) => {
    // Nothing rendered is not a statement that nothing belongs here, and
    // storePresentation runs on every viewport teardown, so skip the write
    // rather than notifying subscribers of an unchanged store.
    if (!items?.length) {
      return;
    }

    set(
      state => {
        const merged = [...(state.segmentationPresentationStore[presentationId] || [])];

        for (const item of items) {
          const index = merged.findIndex(
            existing => existing.segmentationId === item.segmentationId
          );

          if (index === -1) {
            merged.push(item);
            continue;
          }

          merged[index] = { ...item, hydrated: merged[index].hydrated };
        }

        return {
          segmentationPresentationStore: {
            ...state.segmentationPresentationStore,
            [presentationId]: merged,
          },
        };
      },
      false,
      'syncSegmentationPresentation'
    );
  },

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
