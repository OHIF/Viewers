import { ServicesManager, utils, Types } from '@ohif/core';

import { Enums, utilities as csUtils, annotation, Types as cstTypes } from '@cornerstonejs/tools';

import { Types as OhifTypes } from '@ohif/core';
import { vec3 } from 'gl-matrix';
import {
  ContextMenuController,
  defaultContextMenu,
} from './CustomizableContextMenu';
import DicomTagBrowser from './DicomTagBrowser/DicomTagBrowser';
import reuseCachedLayouts from './utils/reuseCachedLayouts';
import findViewportsByPosition, {
  findOrCreateViewport as layoutFindOrCreate,
} from './findViewportsByPosition';
import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { classes } from '@ohif/core';
import { ContextMenuProps } from './CustomizableContextMenu/types';
import { NavigateHistory } from './types/commandModuleTypes';
import { history } from '@ohif/app';
import getThresholdValues from './utils/getThresholdValue';
import calculateSuvPeak from './utils/calculateSUVPeak';
import calculateTMTV from './utils/calculateTMTV';
import createAndDownloadTMTVReport from './utils/createAndDownloadTMTVReport';
import { utilities } from '@cornerstonejs/core';
import customColormap from './utils/colormaps/customColormap';
import { extractURLParameters } from '@kitware/vtk.js/Common/Core/URLExtract';
import { Segmentation } from 'platform/core/src/services/SegmentationService/SegmentationServiceTypes';

const { subscribeToNextViewportGridChange } = utils;
const { registerColormap, getColormapNames } = utilities.colormap;

export type HangingProtocolParams = {
  protocolId?: string;
  stageIndex?: number;
  activeStudyUID?: string;
  stageId?: string;
};

export type UpdateViewportDisplaySetParams = {
  direction: number;
  excludeNonImageModalities?: boolean;
};

const metadataProvider = classes.MetadataProvider;
const RECTANGLE_ROI_THRESHOLD_MANUAL = 'RectangleROIStartEndThreshold';
const LABELMAP = csTools.Enums.SegmentationRepresentations.Labelmap;
/**
 * Determine if a command is a hanging protocol one.
 * For now, just use the two hanging protocol commands that are in this
 * commands module, but if others get added elsewhere this may need enhancing.
 */
const isHangingProtocolCommand = command =>
  command &&
  (command.commandName === 'setHangingProtocol' ||
    command.commandName === 'toggleHangingProtocol');

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const {
    toolGroupService,
    customizationService,
    measurementService,
    hangingProtocolService,
    uiNotificationService,
    viewportGridService,
    displaySetService,
    stateSyncService,
    cornerstoneViewportService,
    toolbarService,
    segmentationService,
  } = (servicesManager as ServicesManager).services;

  // Define a context menu controller for use with any context menus
  const contextMenuController = new ContextMenuController(
    servicesManager,
    commandsManager
  );
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );
  const { getEnabledElement } = utilityModule.exports;

  function _getActiveViewportsEnabledElement() {
    const { activeViewportId } = viewportGridService.getState();
    const { element } = getEnabledElement(activeViewportId) || {};
    const enabledElement = cs.getEnabledElement(element);
    return enabledElement;
  }

  function _getMatchedViewportsToolGroupIds() {
    const { viewportMatchDetails } = hangingProtocolService.getMatchDetails();
    const toolGroupIds = [];
    viewportMatchDetails.forEach((value, key) => {
      const { viewportOptions } = value;
      const { toolGroupId } = viewportOptions;
      if (toolGroupIds.indexOf(toolGroupId) === -1) {
        toolGroupIds.push(toolGroupId);
      }
    });

    return toolGroupIds;
  }
  const actions = {
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
        Object.assign(
          optionsToUse,
          customizationService.get(menuCustomizationId, defaultContextMenu)
        );
      }

      // TODO - make the selectorProps richer by including the study metadata and display set.
      const { protocol, stage } = hangingProtocolService.getActiveProtocol();
      optionsToUse.selectorProps = {
        event,
        protocol,
        stage,
        ...selectorProps,
      };

      contextMenuController.showContextMenu(
        optionsToUse,
        element,
        defaultPointsPosition
      );
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
      measurementService.clear();
    },

    /**
     * Toggles off all tools which contain a commandName of setHangingProtocol
     * or toggleHangingProtocol, and which match/don't match the protocol id/stage
     */
    toggleHpTools: () => {
      const {
        protocol,
        stageIndex: toggleStageIndex,
        stage,
      } = hangingProtocolService.getActiveProtocol();
      const enableListener = button => {
        if (!button.id) return;
        const { commands, items } = button.props || button;
        if (items) {
          items.forEach(enableListener);
        }
        const hpCommand = commands?.find?.(isHangingProtocolCommand);
        if (!hpCommand) return;
        const { protocolId, stageIndex, stageId } = hpCommand.commandOptions;
        const isActive =
          (!protocolId || protocolId === protocol.id) &&
          (stageIndex === undefined || stageIndex === toggleStageIndex) &&
          (!stageId || stageId === stage.id);
        toolbarService.setActive(button.id, isActive);
      };
      Object.values(toolbarService.getButtons()).forEach(enableListener);
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
     */
    setHangingProtocol: ({
      activeStudyUID = '',
      protocolId,
      stageId,
      stageIndex,
      reset = false,
    }: HangingProtocolParams): boolean => {
      try {
        // Stores in the state the display set selector id to displaySetUID mapping
        // Pass in viewportId for the active viewport.  This item will get set as
        // the activeViewportId
        const state = viewportGridService.getState();
        const hpInfo = hangingProtocolService.getState();
        const {
          protocol: oldProtocol,
        } = hangingProtocolService.getActiveProtocol();
        const stateSyncReduce = reuseCachedLayouts(
          state,
          hangingProtocolService,
          stateSyncService
        );
        const {
          hangingProtocolStageIndexMap,
          viewportGridStore,
          displaySetSelectorMap,
        } = stateSyncReduce;

        if (!protocolId) {
          // Re-use the previous protocol id, and optionally stage
          protocolId = hpInfo.protocolId;
          if (stageId === undefined && stageIndex === undefined) {
            stageIndex = hpInfo.stageIndex;
          }
        } else if (stageIndex === undefined && stageId === undefined) {
          // Re-set the same stage as was previously used
          const hangingId = `${activeStudyUID ||
            hpInfo.activeStudyUID}:${protocolId}`;
          stageIndex = hangingProtocolStageIndexMap[hangingId]?.stageIndex;
        }

        const useStageIdx =
          stageIndex ??
          hangingProtocolService.getStageIndex(protocolId, {
            stageId,
            stageIndex,
          });

        if (activeStudyUID) {
          hangingProtocolService.setActiveStudyUID(activeStudyUID);
        }

        const storedHanging = `${
          hangingProtocolService.getState().activeStudyUID
        }:${protocolId}:${useStageIdx || 0}`;

        const restoreProtocol = !reset && viewportGridStore[storedHanging];

        if (
          protocolId === hpInfo.protocolId &&
          useStageIdx === hpInfo.stageIndex &&
          !activeStudyUID
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
            viewportGridService.set(viewportGridStore[storedHanging]);
          }
        }
        // Do this after successfully applying the update
        // Note, don't store the active display set - it is only needed while
        // changing display sets.  This causes jump to measurement to fail on
        // multi-study display.
        delete displaySetSelectorMap[
          `${activeStudyUID || hpInfo.activeStudyUID}:activeDisplaySet:0`
        ];
        stateSyncService.store(stateSyncReduce);
        // This is a default action applied
        actions.toggleHpTools(hangingProtocolService.getActiveProtocol());
        // Send the notification about updating the state
        if (protocolId !== hpInfo.protocolId) {
          const { protocol } = hangingProtocolService.getActiveProtocol();
          // The old protocol callbacks are used for turning off things
          // like crosshairs when moving to the new HP
          commandsManager.run(oldProtocol.callbacks?.onProtocolExit);
          // The new protocol callback is used for things like
          // activating modes etc.
          commandsManager.run(protocol.callbacks?.onProtocolEnter);
        }
        return true;
      } catch (e) {
        actions.toggleHpTools(hangingProtocolService.getActiveProtocol());
        uiNotificationService.show({
          title: 'Apply Hanging Protocol',
          message: 'The hanging protocol could not be applied.',
          type: 'error',
          duration: 3000,
        });
        return false;
      }
    },

    toggleHangingProtocol: ({
      protocolId,
      stageIndex,
    }: HangingProtocolParams): boolean => {
      const {
        protocol,
        stageIndex: desiredStageIndex,
        activeStudy,
      } = hangingProtocolService.getActiveProtocol();
      const { toggleHangingProtocol } = stateSyncService.getState();
      const storedHanging = `${
        activeStudy.StudyInstanceUID
      }:${protocolId}:${stageIndex | 0}`;
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
        stateSyncService.store({
          toggleHangingProtocol: {
            ...toggleHangingProtocol,
            [storedHanging]: {
              protocolId: protocol.id,
              stageIndex: desiredStageIndex,
            },
          },
        });
        return actions.setHangingProtocol({
          protocolId,
          stageIndex,
          reset: true,
        });
      }
    },
    setHounsfieldRange: ({minHU, maxHU, lowHU, highHU, targetNumber}) =>{
      const { activeViewportId, viewports } = viewportGridService.getState();
      console.log(activeViewportId)
      const viewport = cornerstoneViewportService.getCornerstoneViewport(
        activeViewportId
      );
      console.log({minHU, maxHU, lowHU, highHU, targetNumber});
      let props = viewport.getProperties();
      let windowLow = props.voiRange.lower;
      let windowHigh = props.voiRange.upper;
      let newColormap = customColormap(minHU, maxHU, lowHU, highHU, targetNumber, windowLow, windowHigh);
      let colormap ={
        ColorSpace: 'RGB',
        Name: 'HUColormap',
        RGBPoints: newColormap,
      }

      registerColormap(colormap);
    },
    setColorMap: ({ colormap }) => {
      const { viewports } = viewportGridService.getState();
      let views = []
      viewports.forEach(viewport =>{
        console.log(viewport);
        let displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
        commandsManager.runCommand('setSingleViewportColormap', {
          viewportId: viewport.viewportId,
          displaySetInstanceUID,
          colormap: {
            name: colormap,
            opacity: [
              { value: 0, opacity: 0.85 },
              { value: 0.2, opacity: .92 },
              { value: 0.34, opacity: 1 },
              { value: 0.6, opacity: 1 },
              { value: 0.8, opacity: .92 },
              { value: 1, opacity: 0.85 }
            ],
          },
        });
        views.push(
          cornerstoneViewportService.getCornerstoneViewport(viewport.viewportId)
        );
      })


    views.forEach(viewport => {
      viewport.render();
    });

    },
    deltaStage: ({ direction }) => {
      const {
        protocolId,
        stageIndex: oldStageIndex,
      } = hangingProtocolService.getState();
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

    setViewportActive: ({ viewportId }) => {
      const viewportInfo = cornerstoneViewportService.getViewportInfo(
        viewportId
      );
      if (!viewportInfo) {
        console.warn('No viewport found for viewportId:', viewportId);
        return;
      }

      viewportGridService.setActiveViewportId(viewportId);
    },
    /**
     * Changes the viewport grid layout in terms of the MxN layout.
     */
    setViewportGridLayout: ({ numRows, numCols }) => {
      const { protocol } = hangingProtocolService.getActiveProtocol();
      const onLayoutChange = protocol.callbacks?.onLayoutChange;
      if (commandsManager.run(onLayoutChange, { numRows, numCols }) === false) {
        console.log(
          'setViewportGridLayout running',
          onLayoutChange,
          numRows,
          numCols
        );
        // Don't apply the layout if the run command returns false
        return;
      }

      const completeLayout = () => {
        const state = viewportGridService.getState();
        const stateReduce = findViewportsByPosition(
          state,
          { numRows, numCols },
          stateSyncService
        );
        const findOrCreateViewport = layoutFindOrCreate.bind(
          null,
          hangingProtocolService,
          stateReduce.viewportsByPosition
        );

        viewportGridService.setLayout({
          numRows,
          numCols,
          findOrCreateViewport,
        });
        stateSyncService.store(stateReduce);
      };
      // Need to finish any work in the callback
      window.setTimeout(completeLayout, 0);
    },

    toggleOneUp() {
      const viewportGridState = viewportGridService.getState();
      const { activeViewportId, viewports, layout } = viewportGridState;
      const {
        displaySetInstanceUIDs,
        displaySetOptions,
        viewportOptions,
      } = viewports.get(activeViewportId);

      if (layout.numCols === 1 && layout.numRows === 1) {
        // The viewer is in one-up. Check if there is a state to restore/toggle back to.
        const { toggleOneUpViewportGridStore } = stateSyncService.getState();

        if (!toggleOneUpViewportGridStore.layout) {
          return;
        }
        // There is a state to toggle back to. The viewport that was
        // originally toggled to one up was the former active viewport.
        const viewportIdToUpdate =
          toggleOneUpViewportGridStore.activeViewportId;

        // Determine which viewports need to be updated. This is particularly
        // important when MPR is toggled to one up and a different reconstructable
        // is swapped in. Note that currently HangingProtocolService.getViewportsRequireUpdate
        // does not support viewport with multiple display sets.
        const updatedViewports =
          displaySetInstanceUIDs.length > 1
            ? []
            : displaySetInstanceUIDs
                .map(displaySetInstanceUID =>
                  hangingProtocolService.getViewportsRequireUpdate(
                    viewportIdToUpdate,
                    displaySetInstanceUID
                  )
                )
                .flat();

        // This findOrCreateViewport returns either one of the updatedViewports
        // returned from the HP service OR if there is not one from the HP service then
        // simply returns what was in the previous state.
        const findOrCreateViewport = (viewportId: number) => {
          const viewport = updatedViewports.find(
            viewport => viewport.viewportId === viewportId
          );

          return viewport
            ? { viewportOptions, displaySetOptions, ...viewport }
            : toggleOneUpViewportGridStore.viewports[viewportId];
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
        });
      } else {
        // We are not in one-up, so toggle to one up.

        // Store the current viewport grid state so we can toggle it back later.
        stateSyncService.store({
          toggleOneUpViewportGridStore: viewportGridState,
        });

        // This findOrCreateViewport only return one viewport - the active
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
        });

        // Subscribe to ANY (i.e. manual and hanging protocol) layout changes so that
        // any grid layout state to toggle to from one up is cleared. This is performed on
        // a timeout to avoid clearing the state for the actual to one up change.
        // Whenever the next layout change event is fired, the subscriptions are unsubscribed.
        const clearToggleOneUpViewportGridStore = () => {
          const toggleOneUpViewportGridStore = {};
          stateSyncService.store({
            toggleOneUpViewportGridStore,
          });
        };

        subscribeToNextViewportGridChange(
          viewportGridService,
          clearToggleOneUpViewportGridStore
        );
      }
    },
    setToolActive: ({ toolName, toolGroupId = null }) => {
      if (toolName === 'Crosshairs') {
        const activeViewportToolGroup = toolGroupService.getToolGroup(null);

        if (!activeViewportToolGroup._toolInstances.Crosshairs) {
          uiNotificationService.show({
            title: 'Crosshairs',
            message:
              'You need to be in a MPR view to use Crosshairs. Click on MPR button in the toolbar to activate it.',
            type: 'info',
            duration: 3000,
          });

          throw new Error('Crosshairs tool is not available in this viewport');
        }
      }

      const { viewports } = viewportGridService.getState() || {
        viewports: [],
      };
      const toolGroup = servicesManager.services.toolGroupService.getToolGroup(
        toolGroupId
      );
      const toolGroupViewportIds = toolGroup?.getViewportIds?.();

      // if toolGroup has been destroyed, or its viewports have been removed
      if (!toolGroupViewportIds || !toolGroupViewportIds.length) {
        return;
      }

      const filteredViewports = Array.from(viewports.values()).filter(viewport => {
        return toolGroupViewportIds.includes(viewport.viewportId);
      });

      if (!filteredViewports.length) {
        return;
      }

      if (!toolGroup.getToolInstance(toolName)) {
        uiNotificationService.show({
          title: `${toolName} tool`,
          message: `The ${toolName} tool is not available in this viewport.`,
          type: 'info',
          duration: 3000,
        });

        throw new Error(`ToolGroup ${toolGroup.id} does not have this tool.`);
      }

      const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

      if (activeToolName) {
        // Todo: this is a hack to prevent the crosshairs to stick around
        // after another tool is selected. We should find a better way to do this
        if (activeToolName === 'Crosshairs') {
          toolGroup.setToolDisabled(activeToolName);
        } else {
          toolGroup.setToolPassive(activeToolName);
        }
      }
      // Set the new toolName to be active
      toolGroup.setToolActive(toolName, {
        bindings: [
          {
            mouseButton: Enums.MouseBindings.Primary,
          },
        ],
      });
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

    openDICOMTagViewer() {
      const { activeViewportId, viewports } = viewportGridService.getState();
      const activeViewportSpecificData = viewports.get(activeViewportId);
      const { displaySetInstanceUIDs } = activeViewportSpecificData;

      const displaySets = displaySetService.activeDisplaySets;
      const { UIModalService } = servicesManager.services;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      UIModalService.show({
        content: DicomTagBrowser,
        contentProps: {
          displaySets,
          displaySetInstanceUID,
          onClose: UIModalService.hide,
        },
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

      if (
        !viewports ||
        activeViewportId < 0 ||
        activeViewportId > viewports.length - 1
      ) {
        return;
      }

      const activeViewport = viewports.get(activeViewportId);
      const activeDisplaySetInstanceUID =
        activeViewport.displaySetInstanceUIDs[0];

      const thumbnailList = document.querySelector('#ohif-thumbnail-list');

      if (!thumbnailList) {
        return;
      }

      const thumbnailListBounds = thumbnailList.getBoundingClientRect();

      const thumbnail = document.querySelector(
        `#thumbnail-${activeDisplaySetInstanceUID}`
      );

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
      const nonImageModalities = [
        'SR',
        'SEG',
        'SM',
        'RTSTRUCT',
        'RTPLAN',
        'RTDOSE',
      ];

      // Sort the display sets as per the hanging protocol service viewport/display set scoring system.
      // The thumbnail list uses the same sorting.
      const dsSortFn = hangingProtocolService.getDisplaySetSortFunction();
      const currentDisplaySets = [...displaySetService.activeDisplaySets];

      currentDisplaySets.sort(dsSortFn);

      const { activeViewportId, viewports } = viewportGridService.getState();

      const { displaySetInstanceUIDs } = viewports[activeViewportd];

      const activeDisplaySetIndex = currentDisplaySets.findIndex(displaySet =>
        displaySetInstanceUIDs.includes(displaySet.displaySetInstanceUID)
      );

      let displaySetIndexToShow: number;

      for (
        displaySetIndexToShow = activeDisplaySetIndex + direction;
        displaySetIndexToShow > -1 &&
        displaySetIndexToShow < currentDisplaySets.length;
        displaySetIndexToShow += direction
      ) {
        if (
          !excludeNonImageModalities ||
          !nonImageModalities.includes(
            currentDisplaySets[displaySetIndexToShow].Modality
          )
        ) {
          break;
        }
      }

      if (
        displaySetIndexToShow < 0 ||
        displaySetIndexToShow >= currentDisplaySets.length
      ) {
        return;
      }

      const { displaySetInstanceUID } = currentDisplaySets[
        displaySetIndexToShow
      ];

      let updatedViewports = [];

      try {
        updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
          activeViewportId,
          displaySetInstanceUID
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
    getMatchingPTDisplaySet: ({ viewportMatchDetails }) => {
      // Todo: this is assuming that the hanging protocol has successfully matched
      // the correct PT. For future, we should have a way to filter out the PTs
      // that are in the viewer layout (but then we have the problem of the attenuation
      // corrected PT vs the non-attenuation correct PT)

      let ptDisplaySet = null;
      for (const [viewportId, viewportDetails] of viewportMatchDetails) {
        const { displaySetsInfo } = viewportDetails;
        const displaySets = displaySetsInfo.map(({ displaySetInstanceUID }) =>
          displaySetService.getDisplaySetByUID(displaySetInstanceUID)
        );

        if (!displaySets || displaySets.length === 0) {
          continue;
        }

        ptDisplaySet = displaySets.find(
          displaySet => displaySet.Modality === 'PT'
        );

        if (ptDisplaySet) {
          break;
        }
      }

      return ptDisplaySet;
    },
    getPTMetadata: ({ ptDisplaySet }) => {
      const dataSource = extensionManager.getDataSources()[0];
      const imageIds = dataSource.getImageIdsForDisplaySet(ptDisplaySet);

      const firstImageId = imageIds[0];
      const instance = metadataProvider.get('instance', firstImageId);
      if (instance.Modality !== 'PT') {
        return;
      }

      const metadata = {
        SeriesTime: instance.SeriesTime,
        Modality: instance.Modality,
        PatientSex: instance.PatientSex,
        PatientWeight: instance.PatientWeight,
        RadiopharmaceuticalInformationSequence: {
          RadionuclideTotalDose:
            instance.RadiopharmaceuticalInformationSequence[0]
              .RadionuclideTotalDose,
          RadionuclideHalfLife:
            instance.RadiopharmaceuticalInformationSequence[0]
              .RadionuclideHalfLife,
          RadiopharmaceuticalStartTime:
            instance.RadiopharmaceuticalInformationSequence[0]
              .RadiopharmaceuticalStartTime,
          RadiopharmaceuticalStartDateTime:
            instance.RadiopharmaceuticalInformationSequence[0]
              .RadiopharmaceuticalStartDateTime,
        },
      };

      return metadata;
    },
    createNewLabelmapFromPT: async () => {
      // Create a segmentation of the same resolution as the source data
      // using volumeLoader.createAndCacheDerivedVolume.
      const { activeViewportId, viewports } = viewportGridService.getState();
      const activeViewportSpecificData = viewports.get(activeViewportId);
      const { displaySetInstanceUIDs } = activeViewportSpecificData;
      const displaySets = displaySetService.activeDisplaySets;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      const { viewportMatchDetails } = hangingProtocolService.getMatchDetails();

      if (!displaySetInstanceUID) {
        uiNotificationService.error('No matching PT display set found');
        return;
      }

      const segmentationId = await segmentationService.createSegmentationForDisplaySet(
        displaySetInstanceUID
      );

      // Add Segmentation to all toolGroupIds in the viewer
      const toolGroupIds = _getMatchedViewportsToolGroupIds();

      const representationType = LABELMAP;

      for (const toolGroupId of toolGroupIds) {
        const hydrateSegmentation = true;
        await servicesManager.services.segmentationService.addSegmentationRepresentationToToolGroup(
          toolGroupId,
          segmentationId,
          hydrateSegmentation,
          representationType
        );

        servicesManager.services.segmentationService.setActiveSegmentationForToolGroup(
          segmentationId,
          toolGroupId
        );
      }

      return segmentationId;
    },
    setSegmentationActiveForToolGroups: ({ segmentationId }) => {
      const toolGroupIds = _getMatchedViewportsToolGroupIds();

      toolGroupIds.forEach(toolGroupId => {
        servicesManager.services.segmentationService.setActiveSegmentationForToolGroup(
          segmentationId,
          toolGroupId
        );
      });
    },
    thresholdSegmentationByRectangleROITool: ({ segmentationId, config }) => {
      const segmentation = csTools.segmentation.state.getSegmentation(
        segmentationId
      );
      const { activeViewportId, viewports } = viewportGridService.getState();
      const activeViewportSpecificData = viewports.get(activeViewportId);
      const { displaySetInstanceUIDs } = activeViewportSpecificData;

      const displaySets = displaySetService.activeDisplaySets;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      const { representationData } = segmentation;
      const {
        displaySetMatchDetails: matchDetails,
      } = hangingProtocolService.getMatchDetails();
      const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use

      const ctVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`; // VolumeId with loader id + volume id

      const { volumeId: segVolumeId } = representationData[LABELMAP];
      const { referencedVolumeId } = cs.cache.getVolume(segVolumeId);

      const labelmapVolume = cs.cache.getVolume(segmentationId);
      const referencedVolume = cs.cache.getVolume(referencedVolumeId);
      const ctReferencedVolume = cs.cache.getVolume(ctVolumeId);
      console.log(labelmapVolume);
      console.log(referencedVolume);
      console.log(ctReferencedVolume);
      if (!referencedVolume) {
        throw new Error('No Reference volume found');
      }

      if (!labelmapVolume) {
        throw new Error('No Reference labelmap found');
      }

      const annotationUIDs = csTools.annotation.selection.getAnnotationsSelectedByToolName(
        RECTANGLE_ROI_THRESHOLD_MANUAL
      );

      if (annotationUIDs.length === 0) {
        uiNotificationService.show({
          title: 'Commands Module',
          message: 'No ROIThreshold Tool is Selected',
          type: 'error',
        });
        return;
      }
      const { ptLower, ptUpper, ctLower, ctUpper } = getThresholdValues(
        annotationUIDs,
        [referencedVolume, ctReferencedVolume],
        config
      );
      const thresholdVolumeInformation = [
        { volume: referencedVolume, lower: ptLower, upper: ptUpper },
        { volume: ctReferencedVolume, lower: ctLower, upper: ctUpper },
      ]
      console.log(thresholdVolumeInformation);
      const result = csTools.utilities.segmentation.rectangleROIThresholdVolumeByRange(
        annotationUIDs,
        labelmapVolume,
        thresholdVolumeInformation,
        { overwrite: true }
      );
      console.log(result);
      return result;
    },
    getSegmentation:({segmentationId})=>{
      return segmentationService.getSegmentation(
        segmentationId
      );
    },
    thresholdSegmentation: ({segmentationId, minHU, lowHU, highHU,maxHU, targetHUHigh, targetHULow, segmentIndex}) => {
      const segmentation = segmentationService.getSegmentation(
        segmentationId
      );
      const { activeViewportId, viewports } = viewportGridService.getState();
      const activeViewportSpecificData = viewports.get(activeViewportId);
      const { displaySetInstanceUIDs } = activeViewportSpecificData;
      const displaySets = displaySetService.activeDisplaySets;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      const { representationData } = segmentation;
      const {
        displaySetMatchDetails: matchDetails,
      } = hangingProtocolService.getMatchDetails();
      const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use

      const ctVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`; // VolumeId with loader id + volume id

      const { volumeId: segVolumeId } = representationData[LABELMAP];
      const { referencedVolumeId } = cs.cache.getVolume(segVolumeId);
      const labelmapVolume = cs.cache.getVolume(segmentationId);
      const referencedVolume = cs.cache.getVolume(referencedVolumeId);
      const ctReferencedVolume = cs.cache.getVolume(ctVolumeId);
      let boundsIJK: cstTypes.BoundsIJK = [
        [0,labelmapVolume.dimensions[0]-1],
        [0,labelmapVolume.dimensions[1]-1],
        // [labelmapVolume.dimensions[2]-10,labelmapVolume.dimensions[2]-1]
        [labelmapVolume.dimensions[2]-10, labelmapVolume.dimensions[2]-1]
      ];
      const { frameOfReferenceUID } = segmentation;
      const updatePairs = [
        [minHU, lowHU],
        [lowHU, targetHULow],
        [targetHULow, targetHUHigh],
        [targetHUHigh, highHU],
        [highHU, maxHU],
    ];
    const thresholdVolumeInformation = [
      { volume: referencedVolume, lower: updatePairs[segmentIndex-1][0]+1, upper: updatePairs[segmentIndex-1][1]},
      { volume: ctReferencedVolume, lower: updatePairs[segmentIndex-1][0]+1, upper: updatePairs[segmentIndex-1][1] },
    ];
    let result = csTools.utilities.segmentation.thresholdVolumeByRange(
      labelmapVolume,
      thresholdVolumeInformation,
      { overwrite: false, boundsIJK: boundsIJK }
    );
      return result;
    },
    calculateSuvPeak: ({ labelmap }) => {
      const { referencedVolumeId } = labelmap;

      const referencedVolume = cs.cache.getVolume(referencedVolumeId);

      const annotationUIDs = csTools.annotation.selection.getAnnotationsSelectedByToolName(
        RECTANGLE_ROI_THRESHOLD_MANUAL
      );

      const annotations = annotationUIDs.map(annotationUID =>
        csTools.annotation.state.getAnnotation(annotationUID)
      );

      const suvPeak = calculateSuvPeak(labelmap, referencedVolume, annotations);
      return {
        suvPeak: suvPeak.mean,
        suvMax: suvPeak.max,
        suvMaxIJK: suvPeak.maxIJK,
        suvMaxLPS: suvPeak.maxLPS,
      };
    },
    getLesionStats: ({ labelmap, segmentIndex = 1 }) => {
      const { scalarData, spacing } = labelmap;

      const { scalarData: referencedScalarData } = cs.cache.getVolume(
        labelmap.referencedVolumeId
      );

      let segmentationMax = -Infinity;
      let segmentationMin = Infinity;
      const segmentationValues = [];

      let voxelCount = 0;
      for (let i = 0; i < scalarData.length; i++) {
        if (scalarData[i] === segmentIndex) {
          const value = referencedScalarData[i];
          segmentationValues.push(value);
          if (value > segmentationMax) {
            segmentationMax = value;
          }
          if (value < segmentationMin) {
            segmentationMin = value;
          }
          voxelCount++;
        }
      }

      const stats = {
        minValue: segmentationMin,
        maxValue: segmentationMax,
        meanValue: segmentationValues.reduce((a, b) => a + b, 0) / voxelCount,
        stdValue: Math.sqrt(
          segmentationValues.reduce((a, b) => a + b * b, 0) / voxelCount -
            segmentationValues.reduce((a, b) => a + b, 0) / voxelCount ** 2
        ),
        volume: voxelCount * spacing[0] * spacing[1] * spacing[2] * 1e-3,
      };

      return stats;
    },
    calculateLesionGlycolysis: ({ lesionStats }) => {
      const { meanValue, volume } = lesionStats;

      return {
        lesionGlyoclysisStats: volume * meanValue,
      };
    },
    calculateTMTV: ({ segmentations }) => {
      const labelmaps = segmentations.map(s =>
        servicesManager.services.segmentationService.getLabelmapVolume(s.id)
      );

      if (!labelmaps.length) {
        return;
      }

      return calculateTMTV(labelmaps);
    },
    exportTMTVReportCSV: ({ segmentations, tmtv, config }) => {
      const segReport = commandsManager.runCommand('getSegmentationCSVReport', {
        segmentations,
      });

      const tlg = actions.getTotalLesionGlycolysis({ segmentations });
      const additionalReportRows = [
        { key: 'Total Metabolic Tumor Volume', value: { tmtv } },
        { key: 'Total Lesion Glycolysis', value: { tlg: tlg.toFixed(4) } },
        { key: 'Threshold Configuration', value: { ...config } },
      ];

      createAndDownloadTMTVReport(segReport, additionalReportRows);
    },
    getTotalLesionGlycolysis: ({ segmentations }) => {
      const labelmapVolumes = segmentations.map(s =>
        servicesManager.services.segmentationService.getLabelmapVolume(s.id)
      );

      let mergedLabelmap;
      // merge labelmap will through an error if labels maps are not the same size
      // or same direction or ....
      try {
        mergedLabelmap = csTools.utilities.segmentation.createMergedLabelmapForIndex(
          labelmapVolumes
        );
      } catch (e) {
        console.error('commandsModule::getTotalLesionGlycolysis', e);
        return;
      }

      // grabbing the first labelmap referenceVolume since it will be the same for all
      const { referencedVolumeId, spacing } = labelmapVolumes[0];

      if (!referencedVolumeId) {
        console.error(
          'commandsModule::getTotalLesionGlycolysis:No referencedVolumeId found'
        );
      }

      const ptVolume = cs.cache.getVolume(referencedVolumeId);
      const mergedLabelData = mergedLabelmap.scalarData;

      if (mergedLabelData.length !== ptVolume.scalarData.length) {
        console.error(
          'commandsModule::getTotalLesionGlycolysis:Labelmap and ptVolume are not the same size'
        );
      }

      let suv = 0;
      let totalLesionVoxelCount = 0;
      for (let i = 0; i < mergedLabelData.length; i++) {
        // if not background
        if (mergedLabelData[i] !== 0) {
          suv += ptVolume.scalarData[i];
          totalLesionVoxelCount += 1;
        }
      }

      // Average SUV for the merged labelmap
      const averageSuv = suv / totalLesionVoxelCount;

      // total Lesion Glycolysis [suv * ml]
      return (
        averageSuv *
        totalLesionVoxelCount *
        spacing[0] *
        spacing[1] *
        spacing[2] *
        1e-3
      );
    },
    setStartSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();
      const { focalPoint, viewPlaneNormal } = viewport.getCamera();

      const selectedAnnotationUIDs = csTools.annotation.selection.getAnnotationsSelectedByToolName(
        RECTANGLE_ROI_THRESHOLD_MANUAL
      );
      console.log(selectedAnnotationUIDs)
      const annotationUID = selectedAnnotationUIDs[0];
      const annotation = csTools.annotation.state.getAnnotation(annotationUID);

      const { handles } = annotation.data;
      const { points } = handles;

      // get the current slice Index
      const sliceIndex = viewport.getCurrentImageIdIndex();
      annotation.data.startSlice = sliceIndex;
      console.log(annotation);
      // distance between camera focal point and each point on the rectangle
      const newPoints = points.map(point => {
        const distance = vec3.create();
        vec3.subtract(distance, focalPoint, point);
        // distance in the direction of the viewPlaneNormal
        const distanceInViewPlane = vec3.dot(distance, viewPlaneNormal);
        // new point is current point minus distanceInViewPlane
        const newPoint = vec3.create();
        vec3.scaleAndAdd(newPoint, point, viewPlaneNormal, distanceInViewPlane);

        return newPoint;
        //
      });

      handles.points = newPoints;
      // IMPORTANT: invalidate the toolData for the cached stat to get updated
      // and re-calculate the projection points
      annotation.invalidated = true;
      viewport.render();
    },
    setEndSliceForROIThresholdTool: () => {
      const { viewport } = _getActiveViewportsEnabledElement();

      const selectedAnnotationUIDs = csTools.annotation.selection.getAnnotationsSelectedByToolName(
        RECTANGLE_ROI_THRESHOLD_MANUAL
      );

      const annotationUID = selectedAnnotationUIDs[0];

      const annotation = csTools.annotation.state.getAnnotation(annotationUID);

      // get the current slice Index
      const sliceIndex = viewport.getCurrentImageIdIndex();
      annotation.data.endSlice = sliceIndex;

      // IMPORTANT: invalidate the toolData for the cached stat to get updated
      // and re-calculate the projection points
      annotation.invalidated = true;

      viewport.render();
    },
  };

  const definitions = {
    setColormap: {
      commandFn: actions.setColorMap,
    },
    setToolActive: {
      commandFn: actions.setToolActive,
    },
    setViewportActive: {
      commandFn: actions.setViewportActive,
    },
    showContextMenu: {
      commandFn: actions.showContextMenu,
    },
    closeContextMenu: {
      commandFn: actions.closeContextMenu,
    },
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
      storeContexts: [],
      options: {},
    },
    displayNotification: {
      commandFn: actions.displayNotification,
      storeContexts: [],
      options: {},
    },
    setHangingProtocol: {
      commandFn: actions.setHangingProtocol,
      storeContexts: [],
      options: {},
    },
    toggleHangingProtocol: {
      commandFn: actions.toggleHangingProtocol,
      storeContexts: [],
      options: {},
    },
    navigateHistory: {
      commandFn: actions.navigateHistory,
      storeContexts: [],
      options: {},
    },
    nextStage: {
      commandFn: actions.deltaStage,
      storeContexts: [],
      options: { direction: 1 },
    },
    previousStage: {
      commandFn: actions.deltaStage,
      storeContexts: [],
      options: { direction: -1 },
    },
    setViewportGridLayout: {
      commandFn: actions.setViewportGridLayout,
      storeContexts: [],
      options: {},
    },
    toggleOneUp: {
      commandFn: actions.toggleOneUp,
      storeContexts: [],
      options: {},
    },
    openDICOMTagViewer: {
      commandFn: actions.openDICOMTagViewer,
    },
    updateViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
      storeContexts: [],
      options: {},
    },
    calculateTMTV: {
      commandFn: actions.calculateTMTV,
    },
    createNewLabelmapFromPT: {
      commandFn: actions.createNewLabelmapFromPT,
    },
    setSegmentationActiveForToolGroups: {
      commandFn: actions.setSegmentationActiveForToolGroups,
    },
    setEndSliceForROIThresholdTool: {
      commandFn: actions.setEndSliceForROIThresholdTool,
      storeContexts: [],
      options: {},
    },
    setStartSliceForROIThresholdTool: {
      commandFn: actions.setStartSliceForROIThresholdTool,
      storeContexts: [],
      options: {},
    },
    calculateSuvPeak: {
      commandFn: actions.calculateSuvPeak,
    },
    thresholdSegmentationByRectangleROITool: {
      commandFn: actions.thresholdSegmentationByRectangleROITool,
    },
    setHounsfieldRange:{
      commandFn: actions.setHounsfieldRange,
    },
    thresholdSegmentation:{
      commandFn: actions.thresholdSegmentation,
    },
    getSegmentation:{
      commandFn: actions.getSegmentation,
    }
  };

  return {
    actions,
    definitions,
    defaultContext: 'LYTIC',
  };
};

export default commandsModule;
