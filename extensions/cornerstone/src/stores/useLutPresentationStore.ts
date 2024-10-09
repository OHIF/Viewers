import { create } from 'zustand';
import { LutPresentation } from '../types/Presentation';

type LutPresentationState = {
  lutPresentationStore: Record<string, LutPresentation>;
  setLutPresentation: (key: string, value: LutPresentation) => void;
  clearLutPresentationStore: () => void;
};

// Stores a map from `lutPresentationId` to a Presentation object so that
// an OHIFCornerstoneViewport can be redisplayed with the same LUT
export const useLutPresentationStore = create<LutPresentationState>(set => ({
  lutPresentationStore: {},
  setLutPresentation: (key, value) =>
    set(state => ({
      lutPresentationStore: {
        ...state.lutPresentationStore,
        [key]: value,
      },
    })),
  clearLutPresentationStore: () => set({ lutPresentationStore: {} }),
}));
