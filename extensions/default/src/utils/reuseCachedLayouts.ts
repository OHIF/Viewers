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
  const { activeViewportIndex, viewports, layout } = state;
  const hpInfo = hangingProtocolService.getState();
  const { protocolId, stageIndex, activeStudyUID } = hpInfo;
  const { protocol } = hangingProtocolService.getActiveProtocol();
  const stage = protocol.stages[stageIndex];
  const storeId = `${activeStudyUID}:${protocolId}:${stageIndex}`;
  const syncState = syncService.getState();
  const cacheId = `${activeStudyUID}:${protocolId}`;
  const viewportGridStore = { ...syncState.viewportGridStore };
  const hangingProtocolStageIndexMap = {
    ...syncState.hangingProtocolStageIndexMap,
  };
  const displaySetSelectorMap = { ...syncState.displaySetSelectorMap };
  const { rows, columns } = stage.viewportStructure.properties;
  const custom =
    stage.viewports.length !== state.viewports.length ||
    state.layout.numRows !== rows ||
    state.layout.numCols !== columns;

  hangingProtocolStageIndexMap[cacheId] = hpInfo;

  if (storeId && custom) {
    viewportGridStore[storeId] = { ...state };
  }

  for (let idx = 0; idx < state.viewports.length; idx++) {
    const viewport = state.viewports[idx];
    const { displaySetOptions, displaySetInstanceUIDs } = viewport;
    if (!displaySetOptions) continue;
    for (let i = 0; i < displaySetOptions.length; i++) {
      const displaySetUID = displaySetInstanceUIDs[i];
      if (!displaySetUID) continue;
      if (idx === activeViewportIndex && i === 0) {
        displaySetSelectorMap[
          `${activeStudyUID}:activeDisplaySet:0`
        ] = displaySetUID;
      }
      if (displaySetOptions[i]?.id) {
        displaySetSelectorMap[
          `${activeStudyUID}:${displaySetOptions[i].id}:${displaySetOptions[i]
            .matchedDisplaySetsIndex || 0}`
        ] = displaySetUID;
      }
    }
  }

  return {
    hangingProtocolStageIndexMap,
    viewportGridStore,
    displaySetSelectorMap,
  };
};

export default reuseCachedLayout;
