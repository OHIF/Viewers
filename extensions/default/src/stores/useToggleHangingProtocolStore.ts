import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Types } from '@ohif/core';

const PRESENTATION_TYPE_ID = 'toggleHangingProtocolId';
const DEBUG_STORE = false;

/**
 * Represents the state and actions for managing toggle hanging protocols.
 */
type ToggleHangingProtocolState = {
  /**
   * Stores a mapping from key to `HPInfo`.
   */
  toggleHangingProtocol: Record<string, Types.HangingProtocol.HPInfo>;

  /**
   * Sets the toggle hanging protocol for a given key.
   *
   * @param key - The key .
   * @param value - The `HPInfo` to associate with the key.
   */
  setToggleHangingProtocol: (key: string, value: Types.HangingProtocol.HPInfo) => void;

  /**
   * Clears all toggle hanging protocols.
   */
  clearToggleHangingProtocol: () => void;

  /**
   * Type identifier for the store.
   */
  type: string;
};

/**
 * Creates the Toggle Hanging Protocol store.
 *
 * @param set - The zustand set function.
 * @returns The toggle hanging protocol store state and actions.
 */
const createToggleHangingProtocolStore = (set): ToggleHangingProtocolState => ({
  toggleHangingProtocol: {},
  type: PRESENTATION_TYPE_ID,

  /**
   * Sets the toggle hanging protocol for a given key.
   */
  setToggleHangingProtocol: (key, value) =>
    set(
      state => ({
        toggleHangingProtocol: {
          ...state.toggleHangingProtocol,
          [key]: value,
        },
      }),
      false,
      'setToggleHangingProtocol'
    ),

  /**
   * Clears all toggle hanging protocols.
   */
  clearToggleHangingProtocol: () =>
    set({ toggleHangingProtocol: {} }, false, 'clearToggleHangingProtocol'),
});

/**
 * Zustand store for managing toggle hanging protocols.
 * Applies devtools middleware when DEBUG_STORE is enabled.
 */
export const useToggleHangingProtocolStore = create<ToggleHangingProtocolState>()(
  DEBUG_STORE
    ? devtools(createToggleHangingProtocolStore, { name: 'ToggleHangingProtocolStore' })
    : createToggleHangingProtocolStore
);
