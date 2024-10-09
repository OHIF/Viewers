import { create } from 'zustand';

type DisplaySetSelectorState = {
  displaySetSelectorMap: Record<string, string>;
  setDisplaySetSelector: (key: string, value: string) => void;
  clearDisplaySetSelectorMap: () => void;
};

// displaySetSelectorMap stores a map from
// `<activeStudyUID>:<displaySetSelectorId>:<matchOffset>` to
// a displaySetInstanceUID, used to display named display sets in
// specific spots within a hanging protocol and be able to remember what the
// user did with those named spots between stages and protocols.
export const useDisplaySetSelectorStore = create<DisplaySetSelectorState>(set => ({
  displaySetSelectorMap: {},
  setDisplaySetSelector: (key, value) =>
    set(state => ({
      displaySetSelectorMap: {
        ...state.displaySetSelectorMap,
        [key]: value,
      },
    })),
  clearDisplaySetSelectorMap: () => set({ displaySetSelectorMap: {} }),
}));
