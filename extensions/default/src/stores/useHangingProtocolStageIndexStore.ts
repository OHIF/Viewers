import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Types } from '@ohif/core';

const PRESENTATION_TYPE_ID = 'hangingProtocolStageIndexId';
const DEBUG_STORE = false;

/**
 * Represents the state and actions for managing hanging protocol stage indexes.
 */
type HangingProtocolStageIndexState = {
  /**
   * Stores a mapping from key to `HPInfo`.
   */
  hangingProtocolStageIndexMap: Record<string, Types.HangingProtocol.HPInfo>;

  /**
   * Sets the hanging protocol stage index for a given key.
   *
   * @param key - The key.
   * @param value - The `HPInfo` to associate with the key.
   */
  setHangingProtocolStageIndex: (key: string, value: Types.HangingProtocol.HPInfo) => void;

  /**
   * Clears all hanging protocol stage indexes.
   */
  clearHangingProtocolStageIndexMap: () => void;

  /**
   * Type identifier for the store.
   */
  type: string;
};

/**
 * Creates the Hanging Protocol Stage Index store.
 *
 * @param set - The zustand set function.
 * @returns The hanging protocol stage index store state and actions.
 */
const createHangingProtocolStageIndexStore = (set): HangingProtocolStageIndexState => ({
  hangingProtocolStageIndexMap: {},
  type: PRESENTATION_TYPE_ID,

  /**
   * Sets the hanging protocol stage index for a given key.
   */
  setHangingProtocolStageIndex: (key, value) =>
    set(
      state => ({
        hangingProtocolStageIndexMap: {
          ...state.hangingProtocolStageIndexMap,
          [key]: value,
        },
      }),
      false,
      'setHangingProtocolStageIndex'
    ),

  /**
   * Clears all hanging protocol stage indexes.
   */
  clearHangingProtocolStageIndexMap: () =>
    set({ hangingProtocolStageIndexMap: {} }, false, 'clearHangingProtocolStageIndexMap'),
});

/**
 * Zustand store for managing hanging protocol stage indexes.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useHangingProtocolStageIndexStore = create<HangingProtocolStageIndexState>()(
  DEBUG_STORE
    ? devtools(createHangingProtocolStageIndexStore, { name: 'HangingProtocolStageIndexStore' })
    : createHangingProtocolStageIndexStore
);
