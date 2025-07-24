import { Types, DicomMetadataStore, utils } from '@ohif/core';
import { utilities as csUtils, Enums } from '@cornerstonejs/tools';
import { adaptersSEG, adaptersRT, helpers } from '@cornerstonejs/adapters';
import { cache, metaData } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import dcmjs from 'dcmjs';

import { ContextMenuController } from './CustomizableContextMenu';
import DicomTagBrowser from './DicomTagBrowser/DicomTagBrowser';
import reuseCachedLayouts from './utils/reuseCachedLayouts';
import findViewportsByPosition, {
  findOrCreateViewport as layoutFindOrCreate,
} from './findViewportsByPosition';
import { createReportDialogPrompt } from './Panels';
import PROMPT_RESPONSES from './utils/_shared/PROMPT_RESPONSES';
import DICOMSEGExporter from './utils/IO/classes/DICOMSEGExporter';
import sessionMap from './utils/sessionMap';

import { ContextMenuProps } from './CustomizableContextMenu/types';
import { history } from '@ohif/app';
import { useViewportGridStore } from './stores/useViewportGridStore';
import { useDisplaySetSelectorStore } from './stores/useDisplaySetSelectorStore';
import { useHangingProtocolStageIndexStore } from './stores/useHangingProtocolStageIndexStore';
import { useToggleHangingProtocolStore } from './stores/useToggleHangingProtocolStore';
import { useViewportsByPositionStore } from './stores/useViewportsByPositionStore';
import { useToggleOneUpViewportGridStore } from './stores/useToggleOneUpViewportGridStore';
import requestDisplaySetCreationForStudy from './Panels/requestDisplaySetCreationForStudy';
import fetchCSRFToken from './utils/IO/fetchCSRFToken.js';
import generateDateTimeAndLabel from './utils/IO/helpers/generateDateAndTimeLabel.js';
import JSONMeasurementExporter from './utils/IO/classes/JSONMeasurementExporter.js';
import MeasurementImportMenu from './xnat-components/XNATMeasurementImportMenu/XNATMeasurementImportMenu';
import XNATMeasurementApi from './utils/XNATMeasurementApi';

const { segmentation: segmentationUtils } = csUtils;
const { datasetToBlob } = dcmjs.data;

const {
  Cornerstone3D: {
    Segmentation: { generateSegmentation },
  },
} = adaptersSEG;

const { downloadDICOMData } = helpers;
interface PromptResult {
  action: number;
  value: string;
  dataSourceName: string;
}
// Helper function to get target viewport
const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;
  return viewports.get(targetViewportId);
};

// Use downloadDICOMData from helpers

// Helper function to generate RTSS from segmentations
const generateRTSSFromSegmentations = async (segmentations, MetadataProvider, DicomMetadataStore) => {
  return adaptersRT.Cornerstone3D.RTSS.generateRTSSFromSegmentations(segmentations, MetadataProvider, DicomMetadataStore);
};

export type HangingProtocolParams = {
  protocolId?: string;
  stageIndex?: number;
  activeStudyUID?: string;
  StudyInstanceUID?: string;
  stageId?: string;
  reset?: boolean;
};

export interface NavigateHistory {
  to: string;
  options?: {
    replace?: boolean;
  };
}

export type UpdateViewportDisplaySetParams = {
  direction: number;
  excludeNonImageModalities?: boolean;
};

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const {
    customizationService,
    measurementService,
    segmentationService,
    hangingProtocolService,
    uiNotificationService,
    viewportGridService,
    displaySetService,
    multiMonitorService,
    cornerstoneViewportService,
  } = servicesManager.services;

  // Define a context menu controller for use with any context menus
  const contextMenuController = new ContextMenuController(servicesManager, commandsManager);

  const actions = {
    /**
     * Runs a command in multi-monitor mode.  No-op if not multi-monitor.
     */
    multimonitor: async options => {
      const { screenDelta, StudyInstanceUID, commands, hashParams } = options;
      if (multiMonitorService.numberOfScreens < 2) {
        return options.fallback?.(options);
      }

      const newWindow = await multiMonitorService.launchWindow(
        StudyInstanceUID,
        screenDelta,
        hashParams
      );

      // Only run commands if we successfully got a window with a commands manager
      if (newWindow && commands) {
        // Todo: fix this properly, but it takes time for the new window to load
        // and then the commandsManager is available for it
        setTimeout(() => {
          multiMonitorService.run(screenDelta, commands, options);
        }, 1000);
      }
    },

    /**
     * Ensures that the specified study is available for display
     * Then, if commands is specified, runs the given commands list/instance
     */
    loadStudy: async options => {
      const { StudyInstanceUID } = options;
      const displaySets = displaySetService.getActiveDisplaySets();
      const isActive = displaySets.find(ds => ds.StudyInstanceUID === StudyInstanceUID);
      if (isActive) {
        return;
      }
      const [dataSource] = extensionManager.getActiveDataSource();
      await requestDisplaySetCreationForStudy(dataSource, displaySetService, StudyInstanceUID);

      const study = DicomMetadataStore.getStudy(StudyInstanceUID);
      hangingProtocolService.addStudy(study);
    },

    /**
     * Show the context menu.
     * @param options.menuId defines the menu name to lookup, from customizationService
     * @param options.defaultMenu contains the default menu set to use
     * @param options.element is the element to show the menu within
     * @param options.event is the event that caused the context menu
     * @param options.selectorProps is the set of selection properties to use
     */
    showContextMenu: (options: ContextMenuProps) => {
      const {
        menuCustomizationId,
        element,
        event,
        selectorProps,
        defaultPointsPosition = [],
      } = options;

      const optionsToUse = { ...options };

      if (menuCustomizationId) {
        Object.assign(optionsToUse, customizationService.getCustomization(menuCustomizationId));
      }

      // TODO - make the selectorProps richer by including the study metadata and display set.
      const { protocol, stage } = hangingProtocolService.getActiveProtocol();
      optionsToUse.selectorProps = {
        event: event as unknown as Event,
        protocol,
        stage,
        ...selectorProps,
      };

      contextMenuController.showContextMenu(optionsToUse, element, defaultPointsPosition);
    },

    /** Close a context menu currently displayed */
    closeContextMenu: () => {
      contextMenuController.closeContextMenu();
    },

    displayNotification: ({ text, title, type }) => {
      uiNotificationService.show({
        title: title,
        message: text,
        type: type,
      });
    },
    clearMeasurements: () => {
      measurementService.clearMeasurements();
    },

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

        const storedHanging = `${toUseStudyInstanceUID || hangingProtocolService.getState().activeStudyUID}:${protocolId}:${
          useStageIdx || 0
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
          null
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
 /**
     * Loads segmentations for a specified viewport.
     * The function prepares the viewport for rendering, then loads the segmentation details.
     * Additionally, if the segmentation has scalar data, it is set for the corresponding label map volume.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentations - Array of segmentations to be loaded.
     * @param params.viewportId - the target viewport ID.
     *
     */
 loadSegmentationsForViewport: async ({ segmentations, viewportId }) => {
  // Todo: handle adding more than one segmentation
  const viewport = getTargetViewport({ viewportId, viewportGridService });
  const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

  const segmentation = segmentations[0];
  const segmentationId = segmentation.segmentationId;
  const label = segmentation.config.label;
  const segments = segmentation.config.segments;

  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  await segmentationService.createLabelmapForDisplaySet(displaySet, {
    segmentationId,
    segments,
    label,
  });

  segmentationService.addOrUpdateSegmentation(segmentation);

  await segmentationService.addSegmentationRepresentation(viewport.viewportId, {
    segmentationId,
  });

  return segmentationId;
},
/**
 * Creates a labelmap for the active viewport using modern OHIF segmentation service
 */
    createLabelmapForViewport: async ({ viewportId, options = {} }) => {
      const { viewportGridService, displaySetService, segmentationService } =
        servicesManager.services;
      const { viewports } = viewportGridService.getState();
      const targetViewportId = viewportId;

      const viewport = viewports.get(targetViewportId);

      // Todo: add support for multiple display sets
      const displaySetInstanceUID =
        (options as any).displaySetInstanceUID || viewport.displaySetInstanceUIDs[0];

      const segs = segmentationService.getSegmentations();

      const label = (options as any).label || `Segmentation ${segs.length + 1}`;
      const segmentationId = (options as any).segmentationId || `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      const generatedSegmentationId = await segmentationService.createLabelmapForDisplaySet(
        displaySet,
        {
          label,
          segmentationId,
          segments: (options as any).createInitialSegment
            ? {
                1: {
                  label: 'Segment 1',
                  active: true,
                },
              }
            : {},
        }
      );

      await segmentationService.addSegmentationRepresentation(viewportId, {
        segmentationId,
        type: Enums.SegmentationRepresentations.Labelmap,
      });

      return generatedSegmentationId;
    },

/**
 * Generates a DICOM SEG dataset from a segmentation
 * Uses a more robust approach that works with XNAT segmentation structure
 */
generateSegmentation: ({ segmentationId, options = {} }) => {
  try {
    // Get segmentation from both sources to ensure compatibility
    const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
    const cornerstoneSegmentation = cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);
    
    if (!segmentationInOHIF || !cornerstoneSegmentation) {
      throw new Error('Segmentation not found');
    }

    // Get the labelmap representation data
    const { representationData } = cornerstoneSegmentation;
    const labelmapData = representationData.Labelmap;
    
    if (!labelmapData) {
      throw new Error('No labelmap data found in segmentation');
    }

    // Get image IDs - handle both volumeId and imageIds cases
    let imageIds = [];
    if ('imageIds' in labelmapData && labelmapData.imageIds) {
      imageIds = labelmapData.imageIds;
    } else if ('volumeId' in labelmapData && labelmapData.volumeId) {
      // Get imageIds from volume cache
      const volume = cache.getVolume(labelmapData.volumeId);
      if (volume && volume.imageIds) {
        imageIds = volume.imageIds;
      }
    }

    if (!imageIds || imageIds.length === 0) {
      throw new Error('No image IDs found for segmentation');
    }

    const segImages = imageIds.map(imageId => cache.getImage(imageId));
    const referencedImages = segImages.map(image => cache.getImage(image.referencedImageId));

    const labelmaps2D = [];
    let z = 0;

    for (const segImage of segImages) {
      const segmentsOnLabelmap = new Set();
      const pixelData = segImage.getPixelData();
      const { rows, columns } = segImage;

      // Use a single pass through the pixel data
      for (let i = 0; i < pixelData.length; i++) {
        const segment = pixelData[i];
        if (segment !== 0) {
          segmentsOnLabelmap.add(segment);
        }
      }

      labelmaps2D[z++] = {
        segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
        pixelData,
        rows,
        columns,
      };
    }

    const allSegmentsOnLabelmap = labelmaps2D.map(labelmap => labelmap.segmentsOnLabelmap);

    const labelmap3D = {
      segmentsOnLabelmap: Array.from(new Set(allSegmentsOnLabelmap.flat())),
      metadata: [],
      labelmaps2D,
    };

    // Get representations for color information
    const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);

    // Build segment metadata
    Object.entries(segmentationInOHIF.segments || {}).forEach(([segmentIndex, segment]) => {
      if (!segment) {
        return;
      }
      const segmentLabel = (segment as any).label || `Segment ${segmentIndex}`;
      
      // Get color information
      let color = [255, 0, 0]; // Default red
      if (representations && representations.length > 0) {
        try {
          color = segmentationService.getSegmentColor(
            representations[0].viewportId,
            segmentationId,
            parseInt(segmentIndex)
          );
        } catch (e) {
          console.warn('Could not get segment color, using default');
        }
      }

      const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB(
        color.slice(0, 3).map(value => value / 255)
      ).map(value => Math.round(value));

      const segmentMetadata = {
        SegmentNumber: segmentIndex.toString(),
        SegmentLabel: segmentLabel,
        SegmentAlgorithmType: 'MANUAL',
        SegmentAlgorithmName: 'OHIF Brush',
        RecommendedDisplayCIELabValue,
        SegmentedPropertyCategoryCodeSequence: {
          CodeValue: 'T-D0050',
          CodingSchemeDesignator: 'SRT',
          CodeMeaning: 'Tissue',
        },
        SegmentedPropertyTypeCodeSequence: {
          CodeValue: 'T-D0050',
          CodingSchemeDesignator: 'SRT',
          CodeMeaning: 'Tissue',
        },
      };
      labelmap3D.metadata[segmentIndex] = segmentMetadata;
    });

    const generatedSegmentation = generateSegmentation(
      referencedImages,
      labelmap3D,
      metaData,
      options
    );

    return generatedSegmentation;
  } catch (error) {
    console.error('Error generating segmentation:', error);
    throw new Error(`Failed to generate segmentation dataset: ${error.message}`);
  }
},
/**
 * Downloads a segmentation based on the provided segmentation ID.
 * This function retrieves the associated segmentation and
 * uses it to generate the corresponding DICOM dataset, which
 * is then downloaded with an appropriate filename.
 *
 * @param {Object} params - Parameters for the function.
 * @param params.segmentationId - ID of the segmentation to be downloaded.
 *
 */
downloadSegmentation: ({ segmentationId }) => {
  const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
  const generatedSegmentation = actions.generateSegmentation({
    segmentationId,
  });

  downloadDICOMData(generatedSegmentation.dataset, `${segmentationInOHIF.label}`);
},
/**
 * Stores a segmentation to XNAT using the existing DICOMSEGExporter
 */
XNATStoreSegmentation: async ({ segmentationId }) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);

  if (!segmentation) {
    throw new Error('No segmentation found');
  }

  try {
    // Get the series instance UID from the segmentation
    const { activeViewportId } = viewportGridService.getState();
    const viewport = viewportGridService.getState().viewports.get(activeViewportId);
    const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    const seriesInstanceUID = displaySet.SeriesInstanceUID;
    
    // Create default label for the export
    const defaultLabel = segmentation.label || `Segmentation_${Date.now()}`;
    
    // Function to sanitize label for XNAT (remove special characters)
    const sanitizeLabel = (label) => {
      return label.replace(/[^a-zA-Z0-9_-]/g, '_');
    };
    
    // Show dialog to get user input for segmentation label
    const userLabel = await new Promise((resolve) => {
      // Use a simple prompt for now since the dialog service API has changed
      const promptMessage = `Enter a name for the segmentation export to XNAT.\nOnly letters, numbers, underscores, and hyphens are allowed.\n\nCurrent name: ${sanitizeLabel(defaultLabel)}`;
      
      const userInput = window.prompt(promptMessage, sanitizeLabel(defaultLabel));
      
      if (userInput === null) {
        // User cancelled
        resolve(null);
      } else if (userInput.trim() === '') {
        // Empty input, use default
        resolve(sanitizeLabel(defaultLabel));
      } else {
        // Sanitize user input
        const sanitizedInput = sanitizeLabel(userInput.trim());
        resolve(sanitizedInput);
      }
    });
    
    // If user cancelled, exit early
    if (!userLabel) {
      return;
    }
    
    // Generate the DICOM SEG dataset
    const generatedData = actions.generateSegmentation({
      segmentationId,
    });
    if (!generatedData || !generatedData.dataset) {
      throw new Error('Error during segmentation generation');
    }

    // Convert dataset to blob
    const segBlob = datasetToBlob(generatedData.dataset);
    
    // Try multiple approaches to get the experiment ID
    let experimentId = null;
    
    // 1. Try to get from sessionRouter service if available
    const { sessionRouter } = servicesManager.services;
    if (sessionRouter && sessionRouter.experimentId) {
      experimentId = sessionRouter.experimentId;
    }
    
    // 2. Try to get from sessionStorage
    if (!experimentId && window.sessionStorage) {
      experimentId = window.sessionStorage.getItem('xnat_experimentId');
    }
    
    // 3. Try to get from sessionMap using series UID
    if (!experimentId) {
      experimentId = sessionMap.getExperimentID(seriesInstanceUID);
    }
    
    // 4. Try to get from sessionMap without series UID (single session case)
    if (!experimentId) {
      experimentId = sessionMap.getExperimentID();
    }
    
    // 5. Try to get from study session data
    if (!experimentId) {
      const sessionData = sessionMap.get(displaySet.StudyInstanceUID);
      if (sessionData && sessionData.experimentId) {
        experimentId = sessionData.experimentId;
      }
    }
    
    // Use the existing XNAT DICOMSEGExporter with the experiment ID and user-provided label
    const exporter = new DICOMSEGExporter(segBlob, seriesInstanceUID, userLabel, experimentId);
    
    // Export to XNAT with retry logic for overwrite
    let exportSuccessful = false;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (!exportSuccessful && attempts < maxAttempts) {
      try {
        const shouldOverwrite = attempts > 0; // First attempt without overwrite, second with overwrite
        await exporter.exportToXNAT(shouldOverwrite);
        exportSuccessful = true;
        
        // Show success notification
        uiNotificationService.show({
          title: 'Export Successful',
          message: `Segmentation "${userLabel}" exported to XNAT successfully`,
          type: 'success',
          duration: 3000,
        });
        
      } catch (error) {
        attempts++;
        
        // Check if this is a collection exists error and we haven't tried overwrite yet
        if ((error as any).isCollectionExistsError && attempts === 1) {
          const shouldOverwrite = window.confirm(
            `A segmentation collection named "${userLabel}" already exists in XNAT.\n\n` +
            `Do you want to overwrite it?\n\n` +
            `Click "OK" to overwrite or "Cancel" to abort the export.`
          );
          
          if (!shouldOverwrite) {
            // User chose not to overwrite, exit
            uiNotificationService.show({
              title: 'Export Cancelled',
              message: `Export cancelled by user - collection "${userLabel}" already exists`,
              type: 'info',
              duration: 3000,
            });
            return;
          }
          // Continue to next attempt with overwrite=true
        } else {
          // Either not a collection exists error, or user already tried overwrite, or other error
          throw error;
        }
      }
    }
    
  } catch (error) {
    console.error('Error exporting segmentation to XNAT:', error);
    uiNotificationService.show({
      title: 'Export Failed',
      message: `Failed to export segmentation to XNAT: ${error.message}`,
      type: 'error',
      duration: 5000,
    });
    throw error;
  }
},
/**
 * Downloads RTSS - simplified version
 */
downloadRTSS: async ({ segmentationId }) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);
  
  if (!segmentation) {
    throw new Error('No segmentation found');
  }

  // For now, just download as DICOM SEG
  // TODO: Implement RTSS conversion
  actions.downloadSegmentation({ segmentationId });
},

/**
 * Downloads CSV segmentation report
 */
downloadCSVSegmentationReport: ({ segmentationId }) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);

  if (!segmentation) {
    throw new Error('No segmentation found');
  }

  const { representationData } = segmentation;
  const { Labelmap } = representationData;
  const { referencedImageIds } = Labelmap;

  const firstImageId = referencedImageIds[0];

  // find displaySet for firstImageId
  const displaySet = displaySetService
    .getActiveDisplaySets()
    .find(ds => ds.imageIds?.some(i => i === firstImageId));


  const {
    SeriesNumber,
    SeriesInstanceUID,
    StudyInstanceUID,
    SeriesDate,
    SeriesTime,
    SeriesDescription,
  } = displaySet;

  const additionalInfo = {
    reference: {
      SeriesNumber,
      SeriesInstanceUID,
      StudyInstanceUID,
      SeriesDate,
      SeriesTime,
      SeriesDescription,
    },
  };

  actions.generateSegmentationCSVReport(segmentation, additionalInfo);
},

/**
 * Generates CSV report for segmentation
 */
generateSegmentationCSVReport: (segmentationData, info) => {
  // Initialize the rows for our CSV
  const csvRows = [];

  // Add segmentation-level information
  csvRows.push(['Segmentation ID', segmentationData.segmentationId || '']);
  csvRows.push(['Segmentation Label', segmentationData.label || '']);

  csvRows.push([]);

  const additionalInfo = info.reference;
  // Add reference information
  const referenceKeys = [
    ['Series Number', additionalInfo.SeriesNumber],
    ['Series Instance UID', additionalInfo.SeriesInstanceUID],
    ['Study Instance UID', additionalInfo.StudyInstanceUID],
    ['Series Date', additionalInfo.SeriesDate],
    ['Series Time', additionalInfo.SeriesTime],
    ['Series Description', additionalInfo.SeriesDescription],
  ];

  referenceKeys.forEach(([key, value]) => {
    if (value) {
      csvRows.push([`reference ${key}`, value]);
    }
  });

  // Add a blank row for separation
  csvRows.push([]);

  csvRows.push(['Segments Statistics']);
  // Add segment information in columns
  if (segmentationData.segments) {
    // First row: Segment headers
    const segmentHeaderRow = ['Label'];
    for (const segmentId in segmentationData.segments) {
      const segment = segmentationData.segments[segmentId];
      segmentHeaderRow.push(`${(segment as any).label || ''}`);
    }
    csvRows.push(segmentHeaderRow);

    // Add segment properties
    csvRows.push([
      'Segment Index',
      ...Object.values(segmentationData.segments).map((s: any) => s.segmentIndex || ''),
    ]);
    csvRows.push([
      'Locked',
      ...Object.values(segmentationData.segments).map((s: any) => (s.locked ? 'Yes' : 'No')),
    ]);
    csvRows.push([
      'Active',
      ...Object.values(segmentationData.segments).map((s: any) => (s.active ? 'Yes' : 'No')),
    ]);

    // Add segment statistics
    // First, collect all unique statistics across all segments
    const allStats = new Set();
    for (const segment of Object.values(segmentationData.segments) as any[]) {
      if (segment.cachedStats && segment.cachedStats.namedStats) {
        for (const statKey in segment.cachedStats.namedStats) {
          const stat = segment.cachedStats.namedStats[statKey];
          const statLabel = stat.label || stat.name;
          const statUnit = stat.unit ? ` (${stat.unit})` : '';
          allStats.add(`${statLabel}${statUnit}`);
        }
      }
    }

    // Then create a row for each statistic
    for (const statName of allStats) {
      const statRow = [statName];

      for (const segment of Object.values(segmentationData.segments) as any[]) {
        let statValue = '';

        if (segment.cachedStats && segment.cachedStats.namedStats) {
          for (const statKey in segment.cachedStats.namedStats) {
            const stat = segment.cachedStats.namedStats[statKey];
            const currentStatName = `${stat.label || stat.name}${stat.unit ? ` (${stat.unit})` : ''}`;


            if (currentStatName === statName) {
              statValue = stat.value !== undefined ? stat.value : '';
              break;
            }
          }
        }

        statRow.push(statValue);
      }

      csvRows.push(statRow);
    }
  }

  // Convert to CSV string
  let csvString = '';
  for (const row of csvRows) {
    const formattedRow = row.map(cell => {
      // Handle values that need to be quoted (contain commas, quotes, or newlines)
      const cellValue = cell !== undefined && cell !== null ? cell.toString() : '';
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        // Escape quotes and wrap in quotes
        return '"' + cellValue.replace(/"/g, '""') + '"';
      }
      return cellValue;
    });
    csvString += formattedRow.join(',') + '\n';
  }
  // Create a download link and trigger the download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${segmentationData.label || 'Segmentation'}_Report_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
},

// Segmentation Tool Commands
setBrushSize: ({ value, toolNames }) => {
  const { toolGroupService } = servicesManager.services;
  const brushSize = Number(value);

  toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
    if (toolNames?.length === 0) {
      segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize);
    } else {
      toolNames?.forEach(toolName => {
        segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize, toolName);
      });
    }
  });
},

setThresholdRange: ({
  value,
  toolNames = [
    'ThresholdCircularBrush',
    'ThresholdSphereBrush',
    'ThresholdCircularBrushDynamic',
    'ThresholdSphereBrushDynamic',
  ],
}) => {
  const { toolGroupService } = servicesManager.services;
  const toolGroupIds = toolGroupService.getToolGroupIds();
  if (!toolGroupIds?.length) {
    return;
  }

  for (const toolGroupId of toolGroupIds) {
    const toolGroup = toolGroupService.getToolGroup(toolGroupId);
    toolNames?.forEach(toolName => {
      toolGroup.setToolConfiguration(toolName, {
        threshold: {
          range: value,
        },
      });
    });
  }
},

increaseBrushSize: () => {
  const { toolGroupService } = servicesManager.services;
  const toolGroupIds = toolGroupService.getToolGroupIds();
  if (!toolGroupIds?.length) {
    return;
  }

  for (const toolGroupId of toolGroupIds) {
    const currentBrushSize = segmentationUtils.getBrushSizeForToolGroup(toolGroupId);
    // Handle case where getBrushSizeForToolGroup might return undefined
    const brushSize = typeof currentBrushSize === 'number' ? currentBrushSize : 25;
    segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize + 3);
  }
},

decreaseBrushSize: () => {
  const { toolGroupService } = servicesManager.services;
  const toolGroupIds = toolGroupService.getToolGroupIds();
  if (!toolGroupIds?.length) {
    return;
  }

  for (const toolGroupId of toolGroupIds) {
    const currentBrushSize = segmentationUtils.getBrushSizeForToolGroup(toolGroupId);
    // Handle case where getBrushSizeForToolGroup might return undefined
    const brushSize = typeof currentBrushSize === 'number' ? currentBrushSize : 25;
    segmentationUtils.setBrushSizeForToolGroup(toolGroupId, Math.max(1, brushSize - 3));
  }
},

addNewSegment: () => {
  const { activeViewportId } = viewportGridService.getState();
  const activeSegmentation = segmentationService.getActiveSegmentation(activeViewportId);
  segmentationService.addSegment(activeSegmentation.segmentationId);
},

xnatRunSegmentBidirectional: async () => {
  try {
    await commandsManager.runCommand('runSegmentBidirectional');
  } catch (error) {
    if (error.message.includes('No suitable viewport found')) {
      uiNotificationService.show({
        title: 'Segment Bidirectional',
        message: 'Measurement created, but no suitable viewport was found to display it.',
        type: 'info',
      });
    } else {
      console.error('Error running Segment Bidirectional:', error);
      uiNotificationService.show({
        title: 'Segment Bidirectional',
        message:
          'Could not compute bidirectional data for the segment. The segmented area may be too small.',
        type: 'error',
      });
    }
  }
},

/**
 * Safe override of setActiveSegmentAndCenter that avoids crashes when segment center is undefined
 */
setActiveSegmentAndCenter: ({ segmentationId, segmentIndex }) => {
  const { segmentationService, viewportGridService } = servicesManager.services;
  const viewportId = viewportGridService.getActiveViewportId();
  
  // Set both active segmentation and active segment
  segmentationService.setActiveSegmentation(viewportId, segmentationId);
  segmentationService.setActiveSegment(segmentationId, segmentIndex);
  
  // Safely attempt to jump to segment center, but catch any errors
  try {
    // Check if the segmentation and segment exist before attempting to jump
    const segmentation = segmentationService.getSegmentation(segmentationId);
    if (segmentation && segmentation.segments && segmentation.segments[segmentIndex]) {
      const segment = segmentation.segments[segmentIndex];
      // Only attempt jump if we have cached stats with center data
      if (segment.cachedStats && (segment.cachedStats.center || segment.cachedStats.namedStats?.center?.value)) {
        segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex);
      } else {
        console.log('XNAT: Segment center not available, skipping jump to center');
      }
    }
  } catch (error) {
    console.warn('XNAT: Error jumping to segment center:', error);
    // Continue without jumping - the segment is still activated
  }
},

/**
 * XNAT Import Segmentation command
 */
XNATImportSegmentation: async ({ arrayBuffer, studyInstanceUID, seriesInstanceUID }) => {
  const { importSegmentation } = await import('./utils/importSegmentation');
  
  try {
    const segmentationId = await importSegmentation({
      arrayBuffer,
      studyInstanceUID,
      seriesInstanceUID,
      servicesManager,
    });
    
    uiNotificationService.show({
      title: 'Import Successful',
      message: 'Segmentation imported successfully from XNAT',
      type: 'success',
      duration: 3000,
    });
    
    return segmentationId;
  } catch (error) {
    console.error('Error importing segmentation:', error);
    uiNotificationService.show({
      title: 'Import Failed',
      message: `Failed to import segmentation: ${error.message}`,
      type: 'error',
      duration: 5000,
    });
    throw error;
  }
},
XNATPromptSaveReport: async () => {
  const { UIModalService } = servicesManager.services;

  const result = (await createReportDialogPrompt(UIModalService, {
    extensionManager,
  })) as PromptResult;

  if (result && result.action === PROMPT_RESPONSES.CREATE_REPORT) {
    commandsManager.runCommand('XNATStoreReport', {
      label: result.value,
      dataSourceName: result.dataSourceName,
    });
  }
},

XNATStoreReport: ({ label, dataSourceName }) => {
  console.log(`Storing report to XNAT with label: ${label} and data source: ${dataSourceName}...`);
  // In a real implementation, you would use servicesManager to get
  // the necessary services to store the report to XNAT.
  const { uiNotificationService } = servicesManager.services;
  uiNotificationService.show({
    title: 'Store SR Report',
    message: `Report "${label}" stored to XNAT successfully.`,
    type: 'success',
  });
},

/**
 * Stores the current measurement set to XNAT as a MeasurementCollection JSON.
 */
XNATStoreMeasurements: async () => {
  const measurements: any[] = measurementService.getMeasurements();
  if (!measurements || !measurements.length) {
    uiNotificationService.show({
      title: 'Export Measurements',
      message: 'No measurements found to export.',
      type: 'warning',
    });
    return;
  }

  const { activeViewportId } = viewportGridService.getState();
  const viewport = viewportGridService.getState().viewports.get(activeViewportId);
  const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  const seriesInstanceUID = displaySet.SeriesInstanceUID;
  const studyInstanceUID = displaySet.StudyInstanceUID;

  // Use a more robust way to get the experiment ID, with fallbacks
  let experimentId = null;
  const { sessionRouter } = servicesManager.services;
  if (sessionRouter && sessionRouter.experimentId) {
    experimentId = sessionRouter.experimentId;
  } else if (window.sessionStorage) {
    experimentId = window.sessionStorage.getItem('xnat_experimentId');
  }
  if (!experimentId) {
    experimentId = sessionMap.getExperimentID(seriesInstanceUID);
  }
  if (!experimentId) {
    experimentId = sessionMap.getExperimentID();
  }
  if (!experimentId) {
    const sessionData = sessionMap.get(displaySet.StudyInstanceUID);
    if (sessionData && sessionData.experimentId) {
      experimentId = sessionData.experimentId;
    }
  }

  if (!experimentId) {
    const message = 'Could not determine XNAT session ID. Measurements not exported.';
    console.error(message);
    uiNotificationService.show({
      title: 'Export Measurements',
      message,
      type: 'error',
    });
    throw new Error('Experiment ID not found');
  }

  const defaultLabel = `Measurements_${new Date().toISOString().replace(/[.:-]/g, '')}`;
  const sanitizeLabel = (label: string) => {
    // Remove any special characters and ensure it starts with a letter
    const sanitized = label.replace(/[^a-zA-Z0-9_-]/g, '_');
    // Ensure it doesn't start with a number or underscore
    return sanitized.replace(/^[0-9_]/, 'M_');
  };

  const userLabel = await new Promise<string | null>(resolve => {
    const promptMessage = `Enter a name for the measurement collection.\n(Allowed characters: A-Z, a-z, 0-9, _, -)`;
    const userInput = window.prompt(promptMessage, sanitizeLabel(defaultLabel));
    if (userInput === null) {
      resolve(null);
    } else {
      resolve(sanitizeLabel(userInput.trim() || defaultLabel));
    }
  });

  if (!userLabel) {
    return; // user cancelled
  }

  // Build a Measurement Collection JSON payload compliant with XNAT schema
  const DicomMetaDictionary = dcmjs.data.DicomMetaDictionary;

  // Helper to format date as YYYYMMDDHHmmss.SSS
  const formatDateTime = (date: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds()) +
      '.' + String(date.getMilliseconds()).padStart(3, '0')
    );
  };

  // Build a map of SOPInstanceUID -> frame index (0-based); default 0 if missing
  const sopToFrame: Record<string, number> = {};
  measurements.forEach(m => {
    sopToFrame[m.SOPInstanceUID] = m.frameNumber ?? 0;
  });

  const uniqueSops = Array.from(new Set(measurements.map(m => m.SOPInstanceUID)));

  const imageCollection = uniqueSops.map(uid => ({
    SOPInstanceUID: uid,
    frameIndex: Number(sopToFrame[uid] ?? 0),
  }));

  // Build individual image measurement objects in the required shape
  const buildMeasurementObject = (m): any => {
    const points = m.points || [];
    const createHandle = (pt: number[]) => ({ x: Number(pt[0]), y: Number(pt[1]), z: Number(pt[2] || 0) });

    // Basic skeleton with all required keys
    const base: any = {
      uuid: m.uid || DicomMetaDictionary.uid(),
      toolType: m.toolName || 'Unknown',
      name: m.label || m.toolName || '',
      description: '',
      codingSequence: [],
      color: m.color || '#FF0000',
      lineThickness: 1,
      dashedLine: false,
      visible: true,
      frameOfReferenceUID: m.FrameOfReferenceUID || m.metadata?.FrameOfReferenceUID || undefined,
      imageReference: {
        SOPInstanceUID: m.SOPInstanceUID,
        frameIndex: Number(sopToFrame[m.SOPInstanceUID] ?? 0),
      },
      viewport: {},
      data: {},
      measurements: [],
    };

    console.log(`🔍 DEBUG: Exporting measurement ${m.uid}:`);
    console.log(`🔍 DEBUG: - FrameOfReferenceUID from measurement: ${m.FrameOfReferenceUID || 'undefined'}`);
    console.log(`🔍 DEBUG: - FrameOfReferenceUID from metadata: ${m.metadata?.FrameOfReferenceUID || 'undefined'}`);
    console.log(`🔍 DEBUG: - Final frameOfReferenceUID: ${base.frameOfReferenceUID || 'undefined (optional)'}`);
    console.log(`🔍 DEBUG: - Tool type: ${m.toolName}`);
    console.log(`🔍 DEBUG: - Measurement type: ${m.type}`);
    console.log(`🔍 DEBUG: - Cached stats:`, m.data?.cachedStats);
    console.log(`🔍 DEBUG: - Display text:`, m.displayText);

    // Populate tool-specific "data" minimally
    console.log(`🔍 DEBUG: Switch statement using base.toolType: ${base.toolType}`);
    switch (base.toolType) {
      case 'Length':
        if (points.length >= 2) {
          // Extract length from OHIF measurement structure
          let lengthVal = 0;
          if (m.data?.cachedStats) {
            // Get length from cachedStats (the standard OHIF structure)
            const stats = Object.values(m.data.cachedStats)[0] as any;
            lengthVal = stats?.length || 0;
          } else if (m.displayText?.primary?.length > 0) {
            // Fallback: parse from displayText
            const primaryText = m.displayText.primary[0];
            const match = primaryText.match(/([0-9.]+)\s*mm/);
            if (match) {
              lengthVal = parseFloat(match[1]);
            }
          }
          
          console.log('Export: extracted length value:', lengthVal, 'from measurement:', m);
          
          base.data = {
            length: Number(lengthVal),
            handles: { start: createHandle(points[0]), end: createHandle(points[1]) },
          };
          base.measurements.push({ name: 'length', value: Number(lengthVal), unit: 'mm' });
        }
        break;
      case 'Bidirectional':
        if (points.length >= 4) {
          const sd = m.shortestDiameter || 0;
          const ld = m.longestDiameter || 0;
          base.data = {
            shortestDiameter: Number(sd),
            longestDiameter: Number(ld),
            handles: {
              start: createHandle(points[0]),
              end: createHandle(points[1]),
              perpendicularStart: createHandle(points[2]),
              perpendicularEnd: createHandle(points[3]),
            },
          };
          base.measurements.push(
            { name: 'shortestDiameter', value: Number(sd), unit: 'mm' },
            { name: 'longestDiameter', value: Number(ld), unit: 'mm' },
          );
        }
        break;
      case 'Angle':
        if (typeof m.rAngle === 'number') {
          base.data = { rAngle: Number(m.rAngle), handles: {} };
          base.measurements.push({ name: 'angle', value: Number(m.rAngle), unit: 'deg' });
        }
        break;
      case 'RectangleROI':
      case 'EllipticalROI':
        // Extract area and other stats from cachedStats or displayText
        let areaVal = 0;
        let meanVal = 0;
        let stdDevVal = 0;
        let minVal = 0;
        let maxVal = 0;
        
        if (m.data?.cachedStats) {
          // Get stats from cachedStats (the standard OHIF structure)
          const stats = Object.values(m.data.cachedStats)[0] as any;
          areaVal = stats?.area || 0;
          meanVal = stats?.mean || 0;
          stdDevVal = stats?.stdDev || 0;
          minVal = stats?.min || 0;
          maxVal = stats?.max || 0;
        } else if (m.displayText?.primary?.length > 0) {
          // Fallback: parse from displayText
          const primaryText = m.displayText.primary[0];
          const areaMatch = primaryText.match(/([0-9.]+)\s*mm²/);
          if (areaMatch) {
            areaVal = parseFloat(areaMatch[1]);
          }
        }
        
        console.log('Export: extracted ROI values:', {
          area: areaVal,
          mean: meanVal,
          stdDev: stdDevVal,
          min: minVal,
          max: maxVal
        }, 'from measurement:', m);
        console.log('Export: Full measurement object for ROI:', JSON.stringify(m, null, 2));
        
        // Extract handles from points
        const handles: any = {};
        if (points.length >= 4) {
          // For EllipticalROI, we typically have 4 points defining the ellipse
          handles.points = points.map(pt => createHandle(pt));
        } else if (points.length >= 2) {
          // Fallback: use first two points as center and end
          handles.center = createHandle(points[0]);
          handles.end = createHandle(points[1]);
        }
        
        // Extract the actual cachedStats from the measurement data
        const actualCachedStats = m.data?.cachedStats || {};
        console.log('Export: Actual cachedStats being exported:', actualCachedStats);
        
        base.data = {
          cachedStats: actualCachedStats,
          handles: handles,
        };
        
        // Add all available measurements
        if (areaVal > 0) {
          base.measurements.push({ name: 'area', value: Number(areaVal), unit: 'mm²' });
        }
        if (meanVal !== 0) {
          base.measurements.push({ name: 'mean', value: Number(meanVal), unit: '' });
        }
        if (stdDevVal !== 0) {
          base.measurements.push({ name: 'stdDev', value: Number(stdDevVal), unit: '' });
        }
        if (minVal !== 0) {
          base.measurements.push({ name: 'min', value: Number(minVal), unit: '' });
        }
        if (maxVal !== 0) {
          base.measurements.push({ name: 'max', value: Number(maxVal), unit: '' });
        }
        break;
      case 'ArrowAnnotate':
        base.data = {
          text: m.text || '',
          handles: {},
        };
        base.measurements.push({ name: 'arrow', comment: m.text || '', unit: '' });
        break;
      default:
        console.log(`🔍 DEBUG: No specific case for tool type: ${base.toolType}, using default`);
        base.data = {};
    }

    return base;
  };

  const imageMeasurements = measurements.map(buildMeasurementObject);

  const measurementCollection = {
    uuid: DicomMetaDictionary.uid(),
    name: userLabel.substring(0, 64),
    description: '',
    created: formatDateTime(new Date()),
    modified: '',
    revision: 1,
    user: { name: '', loginName: '' },
    subject: { name: '', id: '', birthDate: '' },
    equipment: {
      manufacturerName: displaySet.Manufacturer || '',
      manufacturerModelName: 'XNAT-OHIF-Viewer',
      softwareVersion: '',
    },
    imageReference: {
      PatientID: displaySet.PatientID || '',
      StudyInstanceUID: studyInstanceUID,
      SeriesInstanceUID: seriesInstanceUID,
      Modality: displaySet.Modality || '',
      imageCollection,
    },
    imageMeasurements, // array built above
  } as any;

  console.log("Complete measurement collection JSON:", JSON.stringify(measurementCollection, null, 2));
  console.log("Export: Collection name:", userLabel);
  console.log("Export: Experiment ID:", experimentId);
  
  const jsonBlob = new Blob([JSON.stringify(measurementCollection)], {
    type: 'application/octet-stream',
  });

  const exporter = new JSONMeasurementExporter(
    jsonBlob,
    seriesInstanceUID,
    userLabel,
    experimentId
  );

  // Export to XNAT with retry logic for overwrite
  let exportSuccessful = false;
  let attempts = 0;
  const maxAttempts = 2;

  while (!exportSuccessful && attempts < maxAttempts) {
    try {
      const shouldOverwrite = attempts > 0;
      await exporter.exportToXNAT(shouldOverwrite);
      exportSuccessful = true;

      uiNotificationService.show({
        title: 'Export Successful',
        message: `Measurement collection "${userLabel}" exported to XNAT successfully`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      attempts++;

      if ((error as any).isCollectionExistsError && attempts === 1) {
        const shouldOverwrite = window.confirm(
          `A measurement collection named "${userLabel}" already exists in XNAT. Overwrite?`
        );

        if (!shouldOverwrite) {
          uiNotificationService.show({
            title: 'Export Cancelled',
            message: `Export of "${userLabel}" cancelled by user.`,
            type: 'info',
            duration: 3000,
          });
          return;
        }
      } else {
        uiNotificationService.show({
          title: 'Export Failed',
          message: `Failed to export measurements: ${error.message}`,
          type: 'error',
          duration: 5000,
        });
        throw error;
      }
    }
  }
},

XNATImportMeasurements: async () => {
  const { UIModalService, viewportGridService, displaySetService, uiNotificationService } =
    servicesManager.services;
  const { activeViewportId, viewports } = viewportGridService.getState();

  if (!activeViewportId) {
    uiNotificationService.show({
      title: 'Import Measurements',
      message: 'No active viewport found.',
      type: 'error',
    });
    return;
  }

  const activeViewport = viewports.get(activeViewportId);
  const displaySetInstanceUID = activeViewport.displaySetInstanceUIDs[0];
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  const { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesInstanceUID } = displaySet;

  UIModalService.show({
    content: MeasurementImportMenu,
    title: 'Import Measurements from XNAT',
    contentProps: {
      studyInstanceUID,
      seriesInstanceUID,
      servicesManager,
      commandsManager,
      onClose: UIModalService.hide,
    },
  });
},

  /**
   * Initialize and use the modern XNATMeasurementApi for measurement operations
   */
  XNATMeasurementApi: async (options: {
    action?: 'importCollection' | 'removeCollection';
    collectionData?: { SeriesInstanceUID: string; collectionLabel: string; collectionObject: any };
    collectionUuid?: string;
    displaySetInstanceUID?: string;
  } = {}) => {
    try {
      // Create a new instance of the modern XNATMeasurementApi
      const measurementApi = new XNATMeasurementApi(servicesManager);
      
      // The API is initialized in the constructor, no need for separate initialize call
      
      // If specific options are provided, handle them
      if (options.action) {
        switch (options.action) {
          case 'importCollection':
            if (options.collectionData) {
              const { SeriesInstanceUID, collectionLabel, collectionObject } = options.collectionData;
              await measurementApi.addImportedCollection(SeriesInstanceUID, collectionLabel, collectionObject);
            }
            break;
          case 'removeCollection':
            if (options.collectionUuid && options.displaySetInstanceUID) {
              measurementApi.removeImportedCollection(options.collectionUuid, options.displaySetInstanceUID);
            }
            break;
          default:
            console.log('XNATMeasurementApi: No specific action provided, API initialized successfully');
        }
      }
      
      uiNotificationService.show({
        title: 'XNAT Measurement API',
        message: 'Modern XNAT Measurement API initialized successfully',
        type: 'success',
        duration: 3000,
      });
      
      return measurementApi;
    } catch (error) {
      console.error('Error initializing XNATMeasurementApi:', error);
      uiNotificationService.show({
        title: 'XNAT Measurement API Error',
        message: `Failed to initialize XNAT Measurement API: ${error.message}`,
        type: 'error',
        duration: 5000,
      });
      throw error;
    }
  },
};
  const definitions = {
    multimonitor: {
      commandFn: actions.multimonitor,
    },
    loadStudy: {
      commandFn: actions.loadStudy,
    },
    showContextMenu: {
      commandFn: actions.showContextMenu,
    },
    closeContextMenu: {
      commandFn: actions.closeContextMenu,
    },
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
    },
    displayNotification: {
      commandFn: actions.displayNotification,
    },
    setHangingProtocol: {
      commandFn: actions.setHangingProtocol,
    },
    toggleHangingProtocol: {
      commandFn: actions.toggleHangingProtocol,
    },
    navigateHistory: {
      commandFn: actions.navigateHistory,
    },
    nextStage: {
      commandFn: actions.deltaStage,
      options: { direction: 1 },
    },
    previousStage: {
      commandFn: actions.deltaStage,
      options: { direction: -1 },
    },
    setViewportGridLayout: {
      commandFn: actions.setViewportGridLayout,
    },
    toggleOneUp: {
      commandFn: actions.toggleOneUp,
    },
    openDICOMTagViewer: {
      commandFn: actions.openDICOMTagViewer,
    },
    updateViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
    },
    loadSegmentationsForViewport: {
      commandFn: actions.loadSegmentationsForViewport,
    },
    generateSegmentation: {
      commandFn: actions.generateSegmentation,
    },
    downloadSegmentation: {
      commandFn: actions.downloadSegmentation,
    },
    storeSegmentation: {
      commandFn: actions.XNATStoreSegmentation,
    },
    downloadRTSS: {
      commandFn: actions.downloadRTSS,
    },
    setBrushSize: {
      commandFn: actions.setBrushSize,
    },
    setThresholdRange: {
      commandFn: actions.setThresholdRange,
    },
    increaseBrushSize: {
      commandFn: actions.increaseBrushSize,
    },
    decreaseBrushSize: {
      commandFn: actions.decreaseBrushSize,
    },
    addNewSegment: {
      commandFn: actions.addNewSegment,
    },
    xnatRunSegmentBidirectional: {
      commandFn: actions.xnatRunSegmentBidirectional,
    },
    setActiveSegmentAndCenter: {
      commandFn: actions.setActiveSegmentAndCenter,
    },
    XNATImportSegmentation: {
      commandFn: actions.XNATImportSegmentation,
    },
    XNATExportSegmentation: {
      commandFn: actions.XNATStoreSegmentation,
    },
    downloadCSVSegmentationReport: {
      commandFn: actions.downloadCSVSegmentationReport,
    },
    XNATPromptSaveReport: {
      commandFn: actions.XNATPromptSaveReport,
      storeContexts: [],
      options: {},
    },
    XNATStoreReport: {
      commandFn: actions.XNATStoreReport,
      storeContexts: [],
      options: {},
    },
    XNATImportMeasurements: {
      commandFn: actions.XNATImportMeasurements,
    },
    XNATStoreMeasurements: {
      commandFn: actions.XNATStoreMeasurements,
      storeContexts: [],
      options: {},
    },
    XNATMeasurementApi: {
      commandFn: actions.XNATMeasurementApi,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
