import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SelectedSegmentationByTypeMap } from '../types/SelectedSegmentationByTypeMap';

const PRESENTATION_TYPE_ID = 'selectedSegmentationsForViewportId';
const DEBUG_STORE = false;

/**
 * Represents the state and actions for managing selected segmentations for a viewport by representation type.
 */
type SelectedSegmentationsForViewportState = {
  /**
   * Stores a mapping from viewport id to a map of representation type to segmentation id.
   */
  selectedSegmentationsForViewport: Record<string, SelectedSegmentationByTypeMap>;

  /**
   * Sets the selected segmentations for a given viewport id.
   *
   * @param key - The viewport id.
   * @param value - The `SelectedSegmentationByTypeMap` to associate with the viewport id.
   */
  setSelectedSegmentationsForViewport: (key: string, value: SelectedSegmentationByTypeMap) => void;

  /**
   * Clears all selected segmentations for all viewports.
   */
  clearSelectedSegmentationsForViewportStore: () => void;

  /**
   * Type identifier for the store.
   */
  type: string;
};

/**
 * Creates the Selected Segmentations For Viewport store.
 *
 * @param set - The zustand set function.
 * @returns The selected segmentations for viewport store state and actions.
 */
const createSelectedSegmentationsForViewportStore = (
  set
): SelectedSegmentationsForViewportState => ({
  selectedSegmentationsForViewport: {},
  type: PRESENTATION_TYPE_ID,

  /**
   * Sets the selected segmentations for a given viewport id.
   */
  setSelectedSegmentationsForViewport: (key, value) =>
    set(
      state => ({
        selectedSegmentationsForViewport: {
          ...state.selectedSegmentationsForViewport,
          [key]: value,
        },
      }),
      false,
      'setSelectedSegmentationsForViewport'
    ),

  /**
   * Clears all selected segmentations for all viewports.
   */
  clearSelectedSegmentationsForViewportStore: () =>
    set(
      { selectedSegmentationsForViewport: {} },
      false,
      'clearSelectedSegmentationsForViewportStore'
    ),
});

/**
 * Zustand store for managing selected segmentations for a viewport by representation type.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useSelectedSegmentationsForViewportStore =
  create<SelectedSegmentationsForViewportState>()(
    DEBUG_STORE
      ? devtools(createSelectedSegmentationsForViewportStore, {
          name: 'SelectedSegmentationsForViewportStore',
        })
      : createSelectedSegmentationsForViewportStore
  );
