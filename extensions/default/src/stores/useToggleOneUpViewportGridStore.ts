import { create } from 'zustand';

type ToggleOneUpViewportGridState = {
  toggleOneUpViewportGridStore: any | null;
  setToggleOneUpViewportGridStore: (state: any) => void;
  clearToggleOneUpViewportGridStore: () => void;
};

// Stores the entire ViewportGridService getState when toggling to one up
// (e.g. via a double click) so that it can be restored when toggling back.
export const useToggleOneUpViewportGridStore = create<ToggleOneUpViewportGridState>(set => ({
  toggleOneUpViewportGridStore: null,
  setToggleOneUpViewportGridStore: state => set({ toggleOneUpViewportGridStore: state }),
  clearToggleOneUpViewportGridStore: () => set({ toggleOneUpViewportGridStore: null }),
}));
