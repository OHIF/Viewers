import { Types } from '@ohif/core';
import reuseCachedLayouts from '../utils/reuseCachedLayouts';
import { useHangingProtocolStageIndexStore } from '../stores/useHangingProtocolStageIndexStore';
import { useDisplaySetSelectorStore } from '../stores/useDisplaySetSelectorStore';
import { useToggleHangingProtocolStore } from '../stores/useToggleHangingProtocolStore';
import { useViewportGridStore } from '../stores/useViewportGridStore';
import { HangingProtocolParams } from './types';

export const createHangingProtocolCommands = (
    servicesManager: any,
    commandsManager: any
) => {
    const {
        hangingProtocolService,
        uiNotificationService,
        viewportGridService,
        displaySetService,
    } = servicesManager.services;

    const actions = {
        /**
         *  Sets the specified protocol
         *    1. Records any existing state using the viewport grid service
         *    2. Finds the destination state - this can be one of:
         *       a. The specified protocol stage
         *       b. An alternate (toggled or restored) protocol stage
         *       c. A restored custom layout
         *    3. Finds the parameters for the specified state
         *       a. Gets the displaySetSelectorMap
         *       b. Gets the map by position
         *       c. Gets any toggle mapping to map position to/from current view
         *    4. If restore, then sets layout
         *       a. Maps viewport position by currently displayed viewport map id
         *       b. Uses toggle information to map display set id
         *    5. Else applies the hanging protocol
         *       a. HP Service is provided displaySetSelectorMap
         *       b. HP Service will throw an exception if it isn't applicable
         * @param options - contains information on the HP to apply
         * @param options.activeStudyUID - the updated study to apply the HP to
         * @param options.protocolId - the protocol ID to change to
         * @param options.stageId - the stageId to apply
         * @param options.stageIndex - the index of the stage to go to.
         * @param options.reset - flag to indicate if the HP should be reset to its original and not restored to a previous state
         *
         * commandsManager.run('setHangingProtocol', {
         *   activeStudyUID: '1.2.3',
         *   protocolId: 'myProtocol',
         *   stageId: 'myStage',
         *   stageIndex: 0,
         *   reset: false,
         * });
         */
        setHangingProtocol: ({
            activeStudyUID = '',
            StudyInstanceUID = '',
            protocolId,
            stageId,
            stageIndex,
            reset = false,
        }: HangingProtocolParams): boolean => {
            const toUseStudyInstanceUID = activeStudyUID || StudyInstanceUID;
            try {
                // Stores in the state the display set selector id to displaySetUID mapping
                // Pass in viewportId for the active viewport.  This item will get set as
                // the activeViewportId
                const state = viewportGridService.getState();
                const hpInfo = hangingProtocolService.getState();
                reuseCachedLayouts(state, hangingProtocolService);
                const { hangingProtocolStageIndexMap } = useHangingProtocolStageIndexStore.getState();
                const { displaySetSelectorMap } = useDisplaySetSelectorStore.getState();

                if (!protocolId) {
                    // Reuse the previous protocol id, and optionally stage
                    protocolId = hpInfo.protocolId;
                    if (stageId === undefined && stageIndex === undefined) {
                        stageIndex = hpInfo.stageIndex;
                    }
                } else if (stageIndex === undefined && stageId === undefined) {
                    // Re-set the same stage as was previously used
                    const hangingId = `${toUseStudyInstanceUID || hpInfo.activeStudyUID}:${protocolId}`;
                    stageIndex = hangingProtocolStageIndexMap[hangingId]?.stageIndex;
                }

                const useStageIdx =
                    stageIndex ??
                    hangingProtocolService.getStageIndex(protocolId, {
                        stageId,
                        stageIndex,
                    });

                const activeStudyChanged = hangingProtocolService.setActiveStudyUID(toUseStudyInstanceUID);

                const storedHanging = `${toUseStudyInstanceUID || hangingProtocolService.getState().activeStudyUID}:${protocolId}:${useStageIdx || 0
                    }`;

                const { viewportGridState } = useViewportGridStore.getState();
                const restoreProtocol = !reset && viewportGridState[storedHanging];

                if (
                    reset ||
                    (activeStudyChanged &&
                        !viewportGridState[storedHanging] &&
                        stageIndex === undefined &&
                        stageId === undefined)
                ) {
                    // Run the hanging protocol fresh, re-using the existing study data
                    // This is done on reset or when the study changes and we haven't yet
                    // applied it, and don't specify exact stage to use.
                    const displaySets = displaySetService.getActiveDisplaySets();
                    const activeStudy = {
                        StudyInstanceUID: toUseStudyInstanceUID,
                        displaySets,
                    };
                    hangingProtocolService.run(activeStudy, protocolId);
                } else if (
                    protocolId === hpInfo.protocolId &&
                    useStageIdx === hpInfo.stageIndex &&
                    !toUseStudyInstanceUID
                ) {
                    // Clear the HP setting to reset them
                    hangingProtocolService.setProtocol(protocolId, {
                        stageId,
                        stageIndex: useStageIdx,
                    });
                } else {
                    hangingProtocolService.setProtocol(protocolId, {
                        displaySetSelectorMap,
                        stageId,
                        stageIndex: useStageIdx,
                        restoreProtocol,
                    });
                    if (restoreProtocol) {
                        viewportGridService.set(viewportGridState[storedHanging]);
                    }
                }
                // Do this after successfully applying the update
                const { setDisplaySetSelector } = useDisplaySetSelectorStore.getState();
                setDisplaySetSelector(
                    `${toUseStudyInstanceUID || hpInfo.activeStudyUID}:activeDisplaySet:0`,
                    []
                );
                return true;
            } catch (e) {
                console.error(e);
                uiNotificationService.show({
                    title: 'Apply Hanging Protocol',
                    message: 'The hanging protocol could not be applied.',
                    type: 'error',
                    duration: 3000,
                });
                return false;
            }
        },

        toggleHangingProtocol: ({ protocolId, stageIndex }: HangingProtocolParams): boolean => {
            const {
                protocol,
                stageIndex: desiredStageIndex,
                activeStudy,
            } = hangingProtocolService.getActiveProtocol();
            const { toggleHangingProtocol, setToggleHangingProtocol } =
                useToggleHangingProtocolStore.getState();
            const storedHanging = `${activeStudy.StudyInstanceUID}:${protocolId}:${stageIndex | 0}`;
            if (
                protocol.id === protocolId &&
                (stageIndex === undefined || stageIndex === desiredStageIndex)
            ) {
                // Toggling off - restore to previous state
                const previousState = toggleHangingProtocol[storedHanging] || {
                    protocolId: 'default',
                };
                return actions.setHangingProtocol(previousState);
            } else {
                setToggleHangingProtocol(storedHanging, {
                    protocolId: protocol.id,
                    stageIndex: desiredStageIndex,
                    stageId: protocol.stages[desiredStageIndex]?.id,
                    activeStudyUID: activeStudy.StudyInstanceUID,
                });
                return actions.setHangingProtocol({
                    protocolId,
                    stageIndex,
                    reset: true,
                });
            }
        },

        deltaStage: ({ direction }) => {
            const { protocolId, stageIndex: oldStageIndex } = hangingProtocolService.getState();
            const { protocol } = hangingProtocolService.getActiveProtocol();
            for (
                let stageIndex = oldStageIndex + direction;
                stageIndex >= 0 && stageIndex < protocol.stages.length;
                stageIndex += direction
            ) {
                if (protocol.stages[stageIndex].status !== 'disabled') {
                    return actions.setHangingProtocol({
                        protocolId,
                        stageIndex,
                    });
                }
            }
            uiNotificationService.show({
                title: 'Change Stage',
                message: 'The hanging protocol has no more applicable stages',
                type: 'info',
                duration: 3000,
            });
        },
    };

    return actions;
};
