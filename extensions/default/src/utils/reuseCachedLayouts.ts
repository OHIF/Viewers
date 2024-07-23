import { HangingProtocolService, StateSyncService, Types } from '@ohif/core';

export type ReturnType = {
  hangingProtocolStageIndexMap: Record<string, Types.HangingProtocol.HPInfo>;
  viewportGridStore: Record<string, unknown>;
  displaySetSelectorMap: Record<string, string>;
};

/**
 * Calculates a set of state information for hanging protocols and viewport grid
 * which defines the currently applied hanging protocol state.
 * @param state is the viewport grid state
 * @param syncService is the state sync service to use for getting existing state
 * @returns Set of states that can be applied to the state sync to remember
 *   the current view state.
 */
const reuseCachedLayout = (
  state,
  hangingProtocolService: HangingProtocolService,
  syncService: StateSyncService
): ReturnType => {
  const { activeViewportId } = state;
  const { protocol } = hangingProtocolService.getActiveProtocol();

  if (!protocol) {
    return;
  }

  const hpInfo = hangingProtocolService.getState();
  const { protocolId, stageIndex, activeStudyUID } = hpInfo;

  const syncState = syncService.getState();
  const viewportGridStore = { ...syncState.viewportGridStore };
  const displaySetSelectorMap = { ...syncState.displaySetSelectorMap };

  const stage = protocol.stages[stageIndex];
  const storeId = `${activeStudyUID}:${protocolId}:${stageIndex}`;
  const cacheId = `${activeStudyUID}:${protocolId}`;
  const hangingProtocolStageIndexMap = {
    ...syncState.hangingProtocolStageIndexMap,
  };
  const { rows, columns } = stage.viewportStructure.properties;
  const custom =
    stage.viewports.length !== state.viewports.size ||
    state.layout.numRows !== rows ||
    state.layout.numCols !== columns;

  hangingProtocolStageIndexMap[cacheId] = hpInfo;

  if (storeId && custom) {
    viewportGridStore[storeId] = { ...state };
  }

  state.viewports.forEach((viewport, viewportId) => {
    const { displaySetOptions, displaySetInstanceUIDs } = viewport;
    if (!displaySetOptions) {
      return;
    }
    for (let i = 0; i < displaySetOptions.length; i++) {
      const displaySetUID = displaySetInstanceUIDs[i];
      if (!displaySetUID) {
        continue;
      }
      if (viewportId === activeViewportId && i === 0) {
        displaySetSelectorMap[`${activeStudyUID}:activeDisplaySet:0`] = displaySetUID;
      }
      if (displaySetOptions[i]?.id) {
        displaySetSelectorMap[
          `${activeStudyUID}:${displaySetOptions[i].id}:${
            displaySetOptions[i].matchedDisplaySetsIndex || 0
          }`
        ] = displaySetUID;
      }
    }
  });

  return {
    hangingProtocolStageIndexMap,
    viewportGridStore,
    displaySetSelectorMap,
  };
};

export default reuseCachedLayout;
