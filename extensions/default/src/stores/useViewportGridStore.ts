import { create } from 'zustand';

type ViewportGridState = {
  [key: string]: unknown;
};

type ViewportGridStore = {
  viewportGridState: ViewportGridState;
  setViewportGridState: (key: string, value: unknown) => void;
  clearViewportGridState: () => void;
};

// viewportGridStore is a sync state which stores the entire
// ViewportGridService getState, by the keys `<activeStudyUID>:<protocolId>:<stageIndex>`
// Used to recover manual changes to the layout of a stage.
export const useViewportGridStore = create<ViewportGridStore>(set => ({
  viewportGridState: {},
  setViewportGridState: (key, value) =>
    set(state => ({
      viewportGridState: {
        ...state.viewportGridState,
        [key]: value,
      },
    })),
  clearViewportGridState: () => set({ viewportGridState: {} }),
}));
