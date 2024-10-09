import { create } from 'zustand';
import { Types } from '@ohif/core';

type ToggleHangingProtocolState = {
  toggleHangingProtocol: Record<string, Types.HangingProtocol.HPInfo>;
  setToggleHangingProtocol: (key: string, value: Types.HangingProtocol.HPInfo) => void;
  clearToggleHangingProtocol: () => void;
};

// Stores a map from the to be applied hanging protocols `<activeStudyUID>:<protocolId>`
// to the previously applied hanging protocolStageIndexMap key, in order to toggle
// off the applied protocol and remember the old state.
export const useToggleHangingProtocolStore = create<ToggleHangingProtocolState>(set => ({
  toggleHangingProtocol: {},
  setToggleHangingProtocol: (key, value) =>
    set(state => ({
      toggleHangingProtocol: {
        ...state.toggleHangingProtocol,
        [key]: value,
      },
    })),
  clearToggleHangingProtocol: () => set({ toggleHangingProtocol: {} }),
}));
