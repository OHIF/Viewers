import { create } from 'zustand';

type UIState = {
  [key: string]: unknown;
};

type UIStateStore = {
  uiState: UIState;
  setUIState: (key: string, value: unknown) => void;
  clearUIState: () => void;
};

export const useUIStateStore = create<UIStateStore>(set => ({
  uiState: {},
  setUIState: (key, value) =>
    set(state => ({
      uiState: {
        ...state.uiState,
        [key]: value,
      },
    })),
  clearUIState: () => set({ uiState: {} }),
}));
