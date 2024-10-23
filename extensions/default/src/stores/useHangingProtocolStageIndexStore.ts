import { create } from 'zustand';
import { Types } from '@ohif/core';

type HangingProtocolStageIndexState = {
  hangingProtocolStageIndexMap: Record<string, Types.HangingProtocol.HPInfo>;
  setHangingProtocolStageIndex: (key: string, value: Types.HangingProtocol.HPInfo) => void;
  clearHangingProtocolStageIndexMap: () => void;
};

// Stores a map from `<activeStudyUID>:${protocolId}` to the getHPInfo results
// in order to recover the correct stage when returning to a Hanging Protocol.
export const useHangingProtocolStageIndexStore = create<HangingProtocolStageIndexState>(set => ({
  hangingProtocolStageIndexMap: {},
  setHangingProtocolStageIndex: (key, value) =>
    set(state => ({
      hangingProtocolStageIndexMap: {
        ...state.hangingProtocolStageIndexMap,
        [key]: value,
      },
    })),
  clearHangingProtocolStageIndexMap: () => set({ hangingProtocolStageIndexMap: {} }),
}));
