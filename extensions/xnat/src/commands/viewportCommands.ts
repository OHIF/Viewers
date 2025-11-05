import { Types, DicomMetadataStore } from '@ohif/core';
import DicomTagBrowser from '../DicomTagBrowser/DicomTagBrowser';
import findViewportsByPosition, {
    findOrCreateViewport as layoutFindOrCreate,
} from '../findViewportsByPosition';
import sessionMap from '../utils/sessionMap';
import { history } from '@ohif/app';
import { useViewportGridStore } from '../stores/useViewportGridStore';
import { useDisplaySetSelectorStore } from '../stores/useDisplaySetSelectorStore';
import { useViewportsByPositionStore } from '../stores/useViewportsByPositionStore';
import { useToggleOneUpViewportGridStore } from '../stores/useToggleOneUpViewportGridStore';
import { NavigateHistory, UpdateViewportDisplaySetParams } from './types';

export const createViewportCommands = (
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
         * Changes the viewport grid layout in terms of the MxN layout.
         */
        setViewportGridLayout: ({ numRows, numCols, isHangingProtocolLayout = false }) => {
            const { protocol } = hangingProtocolService.getActiveProtocol();
            const onLayoutChange = protocol.callbacks?.onLayoutChange;
            if (commandsManager.run(onLayoutChange, { numRows, numCols }) === false) {
                // Don't apply the layout if the run command returns false
                return;
            }

            const completeLayout = () => {
                const state = viewportGridService.getState();
                findViewportsByPosition(state, { numRows, numCols });

                const { viewportsByPosition, initialInDisplay } = useViewportsByPositionStore.getState();

                const findOrCreateViewport = layoutFindOrCreate.bind(
                    null,
                    hangingProtocolService,
                    isHangingProtocolLayout,
                    { ...viewportsByPosition, initialInDisplay }
                );

                viewportGridService.setLayout({
                    numRows,
                    numCols,
                    findOrCreateViewport,
                    isHangingProtocolLayout,
                });
            };
            // Need to finish any work in the callback
            window.setTimeout(completeLayout, 0);
        },

        toggleOneUp() {
            const viewportGridState = viewportGridService.getState();
            const { activeViewportId, viewports, layout, isHangingProtocolLayout } = viewportGridState;
            const { displaySetInstanceUIDs, displaySetOptions, viewportOptions } =
                viewports.get(activeViewportId);

            if (layout.numCols === 1 && layout.numRows === 1) {
                // The viewer is in one-up. Check if there is a state to restore/toggle back to.
                const { toggleOneUpViewportGridStore } = useToggleOneUpViewportGridStore.getState();

                if (!toggleOneUpViewportGridStore) {
                    return;
                }
                // There is a state to toggle back to. The viewport that was
                // originally toggled to one up was the former active viewport.
                const viewportIdToUpdate = toggleOneUpViewportGridStore.activeViewportId;

                // We are restoring the previous layout but taking into the account that
                // the current one up viewport might have a new displaySet dragged and dropped on it.
                // updatedViewportsViaHP below contains the viewports applicable to the HP that existed
                // prior to the toggle to one-up - including the updated viewports if a display
                // set swap were to have occurred.
                const updatedViewportsViaHP =
                    displaySetInstanceUIDs.length > 1
                        ? []
                        : displaySetInstanceUIDs
                            .map(displaySetInstanceUID =>
                                hangingProtocolService.getViewportsRequireUpdate(
                                    viewportIdToUpdate,
                                    displaySetInstanceUID,
                                    isHangingProtocolLayout
                                )
                            )
                            .flat();

                // findOrCreateViewport returns either one of the updatedViewportsViaHP
                // returned from the HP service OR if there is not one from the HP service then
                // simply returns what was in the previous state for a given position in the layout.
                const findOrCreateViewport = (position: number, positionId: string) => {
                    // Find the viewport for the given position prior to the toggle to one-up.
                    const preOneUpViewport = Array.from(toggleOneUpViewportGridStore.viewports.values()).find(
                        (viewport: any) => viewport.positionId === positionId
                    );

                    // Use the viewport id from before the toggle to one-up to find any updates to the viewport.
                    const viewport = updatedViewportsViaHP.find(
                        viewport => viewport.viewportId === (preOneUpViewport as any)?.viewportId
                    );

                    return viewport
                        ? // Use the applicable viewport from the HP updated viewports
                        { viewportOptions, displaySetOptions, ...viewport }
                        : // Use the previous viewport for the given position
                        preOneUpViewport;
                };

                const layoutOptions = viewportGridService.getLayoutOptionsFromState(
                    toggleOneUpViewportGridStore
                );

                // Restore the previous layout including the active viewport.
                viewportGridService.setLayout({
                    numRows: toggleOneUpViewportGridStore.layout.numRows,
                    numCols: toggleOneUpViewportGridStore.layout.numCols,
                    activeViewportId: viewportIdToUpdate,
                    layoutOptions,
                    findOrCreateViewport,
                    isHangingProtocolLayout: true,
                });

                // Reset crosshairs after restoring the layout
                setTimeout(() => {
                    commandsManager.runCommand('resetCrosshairs');
                }, 0);
            } else {
                // We are not in one-up, so toggle to one up.

                // Store the current viewport grid state so we can toggle it back later.
                const { setToggleOneUpViewportGridStore } = useToggleOneUpViewportGridStore.getState();
                setToggleOneUpViewportGridStore(viewportGridState);

                // one being toggled to one up.
                const findOrCreateViewport = () => {
                    return {
                        displaySetInstanceUIDs,
                        displaySetOptions,
                        viewportOptions,
                    };
                };

                // Set the layout to be 1x1/one-up.
                viewportGridService.setLayout({
                    numRows: 1,
                    numCols: 1,
                    findOrCreateViewport,
                    isHangingProtocolLayout: true,
                });
            }
        },

        /**
         * Exposes the browser history navigation used by OHIF. This command can be used to either replace or
         * push a new entry into the browser history. For example, the following will replace the current
         * browser history entry with the specified relative URL which changes the study displayed to the
         * study with study instance UID 1.2.3. Note that as a result of using `options.replace = true`, the
         * page prior to invoking this command cannot be returned to via the browser back button.
         *
         * navigateHistory({
         *   to: 'viewer?StudyInstanceUIDs=1.2.3',
         *   options: { replace: true },
         * });
         *
         * @param historyArgs - arguments for the history function;
         *                      the `to` property is the URL;
         *                      the `options.replace` is a boolean indicating if the current browser history entry
         *                      should be replaced or a new entry pushed onto the history (stack); the default value
         *                      for `replace` is false
         */
        navigateHistory(historyArgs: NavigateHistory) {
            history.navigate(historyArgs.to, historyArgs.options);
        },

        openDICOMTagViewer({ displaySetInstanceUID }: { displaySetInstanceUID?: string }) {
            const { activeViewportId, viewports } = viewportGridService.getState();
            const activeViewportSpecificData = viewports.get(activeViewportId);
            const { displaySetInstanceUIDs } = activeViewportSpecificData;

            const displaySets = displaySetService.activeDisplaySets;
            const { UIModalService } = servicesManager.services;

            const defaultDisplaySetInstanceUID = displaySetInstanceUID || displaySetInstanceUIDs[0];

            // Try to get the study instance UID from the display set
            let studyInstanceUID = '';
            let sessionInfo = null;

            // Find the selected display set to get its study UID
            const selectedDisplaySet = displaySets.find(ds =>
                ds.displaySetInstanceUID === defaultDisplaySetInstanceUID
            );

            if (selectedDisplaySet && selectedDisplaySet.StudyInstanceUID) {
                studyInstanceUID = selectedDisplaySet.StudyInstanceUID;

                // Try to get session info from various places
                try {
                    // 1. Try using sessionRouter service if available
                    const { sessionRouter } = servicesManager.services;
                    if (sessionRouter) {
                        sessionInfo = {
                            projectId: sessionRouter.projectId,
                            experimentId: sessionRouter.experimentId,
                            subjectId: sessionRouter.subjectId
                        };
                    }

                    // 2. Check for session in AppContext.xnatSessions map if available
                    if (!sessionInfo && window.sessionStorage) {
                        const projectId = window.sessionStorage.getItem('xnat_projectId');
                        const experimentId = window.sessionStorage.getItem('xnat_experimentId');
                        const subjectId = window.sessionStorage.getItem('xnat_subjectId');

                        if (projectId && experimentId) {
                            sessionInfo = { projectId, experimentId, subjectId };
                        }
                    }

                    // 3. Check dicomMetadataStore for additional session data in study
                    if (!sessionInfo && studyInstanceUID) {
                        const study = DicomMetadataStore.getStudy(studyInstanceUID);
                        if (study && study.experimentId) {
                            sessionInfo = {
                                projectId: study.projectId || '',
                                experimentId: study.experimentId || study.AccessionNumber || '',
                                subjectId: study.subjectId || study.PatientID || ''
                            };
                        }
                    }

                } catch (error) {
                    console.warn('XNAT: Error getting session info for Tag Browser:', error);
                }
            }

            UIModalService.show({
                content: DicomTagBrowser,
                contentProps: {
                    displaySets,
                    displaySetInstanceUID: defaultDisplaySetInstanceUID,
                    onClose: UIModalService.hide,
                    sessionInfo, // Pass session info to DicomTagBrowser if available
                    studyInstanceUID,
                },
                containerClassName: 'w-[70%] max-w-[900px]',
                title: 'DICOM Tag Browser',
            });
        },

        /**
         * Toggle viewport overlay (the information panel shown on the four corners
         * of the viewport)
         * @see ViewportOverlay and CustomizableViewportOverlay components
         */
        toggleOverlays: () => {
            const overlays = document.getElementsByClassName('viewport-overlay');
            for (let i = 0; i < overlays.length; i++) {
                overlays.item(i).classList.toggle('hidden');
            }
        },

        scrollActiveThumbnailIntoView: () => {
            const { activeViewportId, viewports } = viewportGridService.getState();

            const activeViewport = viewports.get(activeViewportId);
            const activeDisplaySetInstanceUID = activeViewport.displaySetInstanceUIDs[0];

            const thumbnailList = document.querySelector('#ohif-thumbnail-list');

            if (!thumbnailList) {
                return;
            }

            const thumbnailListBounds = thumbnailList.getBoundingClientRect();

            const thumbnail = document.querySelector(`#thumbnail-${activeDisplaySetInstanceUID}`);

            if (!thumbnail) {
                return;
            }

            const thumbnailBounds = thumbnail.getBoundingClientRect();

            // This only handles a vertical thumbnail list.
            if (
                thumbnailBounds.top >= thumbnailListBounds.top &&
                thumbnailBounds.top <= thumbnailListBounds.bottom
            ) {
                return;
            }

            thumbnail.scrollIntoView({ behavior: 'smooth' });
        },

        updateViewportDisplaySet: ({
            direction,
            excludeNonImageModalities,
        }: UpdateViewportDisplaySetParams) => {
            const nonImageModalities = ['SR', 'SEG', 'SM', 'RTSTRUCT', 'RTPLAN', 'RTDOSE'];

            const currentDisplaySets = [...displaySetService.activeDisplaySets];

            const { activeViewportId, viewports, isHangingProtocolLayout } =
                viewportGridService.getState();

            const { displaySetInstanceUIDs } = viewports.get(activeViewportId);
            const activeDisplaySetIndex = currentDisplaySets.findIndex(displaySet =>
                displaySetInstanceUIDs.includes(displaySet.displaySetInstanceUID)
            );

            let displaySetIndexToShow: number;

            for (
                displaySetIndexToShow = activeDisplaySetIndex + direction;
                displaySetIndexToShow > -1 && displaySetIndexToShow < currentDisplaySets.length;
                displaySetIndexToShow += direction
            ) {
                if (
                    !excludeNonImageModalities ||
                    !nonImageModalities.includes(currentDisplaySets[displaySetIndexToShow].Modality)
                ) {
                    break;
                }
            }

            if (displaySetIndexToShow < 0 || displaySetIndexToShow >= currentDisplaySets.length) {
                return;
            }

            const { displaySetInstanceUID } = currentDisplaySets[displaySetIndexToShow];

            let updatedViewports = [];

            try {
                updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
                    activeViewportId,
                    displaySetInstanceUID,
                    isHangingProtocolLayout
                );
            } catch (error) {
                console.warn(error);
                uiNotificationService.show({
                    title: 'Navigate Viewport Display Set',
                    message:
                        'The requested display sets could not be added to the viewport due to a mismatch in the Hanging Protocol rules.',
                    type: 'info',
                    duration: 3000,
                });
            }

            viewportGridService.setDisplaySetsForViewports(updatedViewports);

            setTimeout(() => actions.scrollActiveThumbnailIntoView(), 0);
        },
    };

    return actions;
};
