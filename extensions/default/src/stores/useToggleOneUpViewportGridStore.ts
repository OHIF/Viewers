import { create } from 'zustand';

const PRESENTATION_TYPE_ID = 'toggleOneUpViewportGridId';

type ToggleOneUpViewportGridState = {
  toggleOneUpViewportGridStore: any | null;
  setToggleOneUpViewportGridStore: (state: any) => void;
  clearToggleOneUpViewportGridStore: () => void;
  type: string;
};

// Stores the entire ViewportGridService getState when toggling to one up
// (e.g. via a double click) so that it can be restored when toggling back.
export const useToggleOneUpViewportGridStore = create<ToggleOneUpViewportGridState>(set => ({
  toggleOneUpViewportGridStore: null,
  type: PRESENTATION_TYPE_ID,
  setToggleOneUpViewportGridStore: state => set({ toggleOneUpViewportGridStore: state }),
  clearToggleOneUpViewportGridStore: () => set({ toggleOneUpViewportGridStore: null }),
}));
