import { HangingProtocolService, Types } from '@ohif/core';
import { useViewportGridStore } from '../stores/useViewportGridStore';
import { useDisplaySetSelectorStore } from '../stores/useDisplaySetSelectorStore';
import { useHangingProtocolStageIndexStore } from '../stores/useHangingProtocolStageIndexStore';

export type ReturnType = {
  hangingProtocolStageIndexMap: Record<string, Types.HangingProtocol.HPInfo>;
  viewportGridStore: Record<string, unknown>;
  displaySetSelectorMap: Record<string, Array<string>>;
};

/**
 * Calculates a set of state information for hanging protocols and viewport grid
 * which defines the currently applied hanging protocol state.
 * @param state is the viewport grid state
 * @param syncService is the state sync service to use for getting existing state
 * @returns Set of states that can be applied to the state sync to remember
 *   the current view state.
 */
const reuseCachedLayout = (state, hangingProtocolService: HangingProtocolService): ReturnType => {
  const { activeViewportId } = state;
  const { protocol } = hangingProtocolService.getActiveProtocol();

  if (!protocol) {
    return;
  }

  const hpInfo = hangingProtocolService.getState();
  const { protocolId, stageIndex, activeStudyUID } = hpInfo;

  const { viewportGridState, setViewportGridState } = useViewportGridStore.getState();
  const { displaySetSelectorMap, setDisplaySetSelector } = useDisplaySetSelectorStore.getState();
  const { hangingProtocolStageIndexMap, setHangingProtocolStageIndex } =
    useHangingProtocolStageIndexStore.getState();

  const stage = protocol.stages[stageIndex];
  const storeId = `${activeStudyUID}:${protocolId}:${stageIndex}`;
  const cacheId = `${activeStudyUID}:${protocolId}`;
  const { rows, columns } = stage.viewportStructure.properties;
  const custom =
    stage.viewports.length !== state.viewports.size ||
    state.layout.numRows !== rows ||
    state.layout.numCols !== columns;

  hangingProtocolStageIndexMap[cacheId] = hpInfo;

  if (storeId && custom) {
    setViewportGridState(storeId, { ...state });
  }

  state.viewports.forEach((viewport, viewportId) => {
    const { displaySetOptions, displaySetInstanceUIDs } = viewport;
    if (!displaySetOptions) {
      return;
    }
    const activeDisplaySetUIDs = [];

    for (let i = 0; i < displaySetOptions.length; i++) {
      const displaySetUID = displaySetInstanceUIDs[i];
      if (!displaySetUID) {
        continue;
      }
      if (viewportId === activeViewportId) {
        activeDisplaySetUIDs.push(displaySetUID);
      }

      // The activeDisplaySet selector should only be set once (i.e. for the actual active display set)
      if (displaySetOptions[i]?.id && displaySetOptions[i].id !== 'activeDisplaySet') {
        // TODO: handle multiple layers/display sets for the non-active viewports
        setDisplaySetSelector(
          `${activeStudyUID}:${displaySetOptions[i].id}:${
            displaySetOptions[i].matchedDisplaySetsIndex || 0
          }`,
          [displaySetUID]
        );
      }
    }

    if (viewportId === activeViewportId) {
      // After going through all the display set options for the active viewport, store the display set selector array
      setDisplaySetSelector(`${activeStudyUID}:activeDisplaySet:0`, activeDisplaySetUIDs);
    }
  });

  setHangingProtocolStageIndex(cacheId, hpInfo);

  return {
    hangingProtocolStageIndexMap,
    viewportGridStore: viewportGridState,
    displaySetSelectorMap,
  };
};

export default reuseCachedLayout;
