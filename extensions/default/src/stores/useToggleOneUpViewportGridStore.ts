import { create } from 'zustand';
import type { ViewportGridSnapshot } from '@ohif/core';

const PRESENTATION_TYPE_ID = 'toggleOneUpViewportGridId';

type ToggleOneUpViewportGridState = {
  toggleOneUpViewportGridStore: ViewportGridSnapshot | null;
  setToggleOneUpViewportGridStore: (state: ViewportGridSnapshot) => void;
  clearToggleOneUpViewportGridStore: () => void;
  type: string;
};

// Stores a deep ViewportGridService.snapshot() taken when toggling to one up
// (e.g. via a double click) so that it can be restored when toggling back.
export const useToggleOneUpViewportGridStore = create<ToggleOneUpViewportGridState>(set => ({
  toggleOneUpViewportGridStore: null,
  type: PRESENTATION_TYPE_ID,
  setToggleOneUpViewportGridStore: state => set({ toggleOneUpViewportGridStore: state }),
  clearToggleOneUpViewportGridStore: () => set({ toggleOneUpViewportGridStore: null }),
}));
