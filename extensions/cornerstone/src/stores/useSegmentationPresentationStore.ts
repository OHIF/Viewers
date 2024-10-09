import { create } from 'zustand';

// Stores a map from `segmentationPresentationId` to a Presentation object so that
// an OHIFCornerstoneViewport can be redisplayed with the same Segmentation
export const useSegmentationPresentationStore = create(set => ({
  segmentationPresentationStore: {},
  setSegmentationPresentation: (key, value) =>
    set(state => ({
      segmentationPresentationStore: {
        ...state.segmentationPresentationStore,
        [key]: value,
      },
    })),
  clearSegmentationPresentationStore: () => set({ segmentationPresentationStore: {} }),
}));
