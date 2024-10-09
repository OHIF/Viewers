import { create } from 'zustand';
import { PositionPresentation } from '../types/Presentation';

type PositionPresentationState = {
  positionPresentationStore: Record<string, PositionPresentation>;
  setPositionPresentation: (key: string, value: PositionPresentation) => void;
  clearPositionPresentationStore: () => void;
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
}));
