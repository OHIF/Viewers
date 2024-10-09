import { create } from 'zustand';

type ViewportsByPositionState = {
  viewportsByPosition: Record<string, unknown>;
  setViewportsByPosition: (key: string, value: unknown) => void;
  clearViewportsByPosition: () => void;
};

// Stores the viewports by `rows-cols` position so that when the layout
// changes numRows and numCols, the viewports can be remembered and then replaced
// afterwards.
export const useViewportsByPositionStore = create<ViewportsByPositionState>(set => ({
  viewportsByPosition: {},
  setViewportsByPosition: (key, value) =>
    set(state => ({
      viewportsByPosition: {
        ...state.viewportsByPosition,
        [key]: value,
      },
    })),
  clearViewportsByPosition: () => set({ viewportsByPosition: {} }),
}));
