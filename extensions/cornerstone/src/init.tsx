import OHIF, { Types, errorHandler } from '@ohif/core';
import React from 'react';

import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  init as cs3DInit,
  eventTarget,
  EVENTS,
  metaData,
  volumeLoader,
  imageLoadPoolManager,
  Settings,
  utilities as csUtilities,
  Enums as csEnums,
} from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { cornerstoneStreamingImageVolumeLoader } from '@cornerstonejs/streaming-image-volume-loader';

import initWADOImageLoader from './initWADOImageLoader';
import initCornerstoneTools from './initCornerstoneTools';

import { connectToolsToMeasurementService } from './initMeasurementService';
import initCineService from './initCineService';
import interleaveCenterLoader from './utils/interleaveCenterLoader';
import nthLoader from './utils/nthLoader';
import interleaveTopToBottom from './utils/interleaveTopToBottom';
import initContextMenu from './initContextMenu';
import initDoubleClick from './initDoubleClick';
import { CornerstoneServices } from './types';
import initViewTiming from './utils/initViewTiming';

import * as stackPrefetch from '@newlantern/extension-default/src/stackPrefetch';

// TODO: Cypress tests are currently grabbing this from the window?
window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;
/**
 *
 */
export default async function init({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
  appConfig,
}: Types.Extensions.ExtensionParams): Promise<void> {
  // Note: this should run first before initializing the cornerstone
  // DO NOT CHANGE THE ORDER
  const value = appConfig.useSharedArrayBuffer;
  let sharedArrayBufferDisabled = false;

  if (value === 'AUTO') {
    cornerstone.setUseSharedArrayBuffer(csEnums.SharedArrayBufferModes.AUTO);
  } else if (value === 'FALSE' || value === false) {
    cornerstone.setUseSharedArrayBuffer(csEnums.SharedArrayBufferModes.FALSE);
    sharedArrayBufferDisabled = true;
  } else {
    cornerstone.setUseSharedArrayBuffer(csEnums.SharedArrayBufferModes.TRUE);
  }

  await cs3DInit({
    rendering: {
      preferSizeOverAccuracy: Boolean(appConfig.preferSizeOverAccuracy),
      useNorm16Texture: Boolean(appConfig.useNorm16Texture),
    },
  });

  // For debugging e2e tests that are failing on CI
  cornerstone.setUseCPURendering(Boolean(appConfig.useCPURendering));

  cornerstone.setConfiguration({
    ...cornerstone.getConfiguration(),
    rendering: {
      ...cornerstone.getConfiguration().rendering,
      strictZSpacingForVolumeViewport: appConfig.strictZSpacingForVolumeViewport,
    },
  });

  // For debugging large datasets, otherwise prefer the defaults
  const { maxCacheSize } = appConfig;
  if (maxCacheSize) {
    cornerstone.cache.setMaxCacheSize(maxCacheSize);
  }

  initCornerstoneTools();

  Settings.getRuntimeSettings().set('useCursors', Boolean(appConfig.useCursors));

  const {
    userAuthenticationService,
    customizationService,
    displaySetService,
    uiModalService,
    uiNotificationService,
    cineService,
    cornerstoneViewportService,
    hangingProtocolService,
    toolGroupService,
    toolbarService,
    viewportGridService,
    stateSyncService,
  } = servicesManager.services as CornerstoneServices;

  window.services = servicesManager.services;
  window.extensionManager = extensionManager;
  window.commandsManager = commandsManager;

  if (
    appConfig.showWarningMessageForCrossOrigin &&
    !window.crossOriginIsolated &&
    !sharedArrayBufferDisabled
  ) {
    uiNotificationService.show({
      title: 'Cross Origin Isolation',
      message:
        'Cross Origin Isolation is not enabled, read more about it here: https://docs.ohif.org/faq/',
      type: 'warning',
    });
  }

  if (appConfig.showCPUFallbackMessage && cornerstone.getShouldUseCPURendering()) {
    _showCPURenderingModal(uiModalService, hangingProtocolService);
  }

  // Stores a map from `lutPresentationId` to a Presentation object so that
  // an OHIFCornerstoneViewport can be redisplayed with the same LUT
  stateSyncService.register('lutPresentationStore', { clearOnModeExit: true });

  // Stores a map from `positionPresentationId` to a Presentation object so that
  // an OHIFCornerstoneViewport can be redisplayed with the same position
  stateSyncService.register('positionPresentationStore', {
    clearOnModeExit: true,
  });

  // Stores the entire ViewportGridService getState when toggling to one up
  // (e.g. via a double click) so that it can be restored when toggling back.
  stateSyncService.register('toggleOneUpViewportGridStore', {
    clearOnModeExit: true,
  });

  const labelmapRepresentation = cornerstoneTools.Enums.SegmentationRepresentations.Labelmap;

  cornerstoneTools.segmentation.config.setGlobalRepresentationConfig(labelmapRepresentation, {
    fillAlpha: 0.3,
    fillAlphaInactive: 0.2,
    outlineOpacity: 1,
    outlineOpacityInactive: 0.65,
  });

  const metadataProvider = OHIF.classes.MetadataProvider;

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  hangingProtocolService.registerImageLoadStrategy('interleaveCenter', interleaveCenterLoader);
  hangingProtocolService.registerImageLoadStrategy('interleaveTopToBottom', interleaveTopToBottom);
  hangingProtocolService.registerImageLoadStrategy('nth', nthLoader);

  // add metadata providers
  metaData.addProvider(
    csUtilities.calibratedPixelSpacingMetadataProvider.get.bind(
      csUtilities.calibratedPixelSpacingMetadataProvider
    )
  ); // this provider is required for Calibration tool
  metaData.addProvider(metadataProvider.get.bind(metadataProvider), 9999);

  imageLoadPoolManager.maxNumRequests = {
    interaction: appConfig?.maxNumRequests?.interaction || 100,
    thumbnail: appConfig?.maxNumRequests?.thumbnail || 75,
    prefetch: appConfig?.maxNumRequests?.prefetch || 10,
  };

  initWADOImageLoader(userAuthenticationService, appConfig, extensionManager);

  /* Measurement Service */
  this.measurementServiceSource = connectToolsToMeasurementService(servicesManager);

  initCineService(cineService);

  // When a custom image load is performed, update the relevant viewports
  hangingProtocolService.subscribe(
    hangingProtocolService.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED,
    volumeInputArrayMap => {
      for (const entry of volumeInputArrayMap.entries()) {
        const [viewportId, volumeInputArray] = entry;
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        const ohifViewport = cornerstoneViewportService.getViewportInfo(viewportId);

        const { lutPresentationStore, positionPresentationStore } = stateSyncService.getState();
        const { presentationIds } = ohifViewport.getViewportOptions();
        const presentations = {
          positionPresentation: positionPresentationStore[presentationIds?.positionPresentationId],
          lutPresentation: lutPresentationStore[presentationIds?.lutPresentationId],
        };

        cornerstoneViewportService.setVolumesForViewport(viewport, volumeInputArray, presentations);
      }
    }
  );

  initContextMenu({
    cornerstoneViewportService,
    customizationService,
    commandsManager,
  });

  initDoubleClick({
    customizationService,
    commandsManager,
  });

  let priorityCounter = 1000000;
  let enabledElementCounter = 0;
  let STUDY_STACKS = [];

  /**
   * When a viewport gets a new display set, this call will go through all the
   * active tools in the toolbar, and call any commands registered in the
   * toolbar service with a callback to re-enable on displaying the viewport.
   */
  const toolbarEventListener = evt => {
    const { element } = evt.detail;
    const activeTools = toolbarService.getActiveTools();

    activeTools.forEach(tool => {
      const toolData = toolbarService.getNestedButton(tool);
      const commands = toolData?.listeners?.[evt.type];
      commandsManager.run(commands, { element, evt });
    });
  };

  /** Listens for active viewport events and fires the toolbar listeners */
  const activeViewportEventListener = evt => {
    const { viewportId } = evt;
    const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

    const activeTools = toolbarService.getActiveTools();

    activeTools.forEach(tool => {
      if (!toolGroup?._toolInstances?.[tool]) {
        return;
      }

      // check if tool is active on the new viewport
      const toolEnabled = toolGroup._toolInstances[tool].mode === Enums.ToolModes.Enabled;

      if (!toolEnabled) {
        return;
      }

      const button = toolbarService.getNestedButton(tool);
      const commands = button?.listeners?.[evt.type];
      commandsManager.run(commands, { viewportId, evt });
    });
  };

  /**
   * Runs error handler for failed requests.
   * @param event
   */
  const imageLoadFailedHandler = ({ detail }) => {
    const handler = errorHandler.getHTTPErrorHandler();
    handler(detail.error);
  };

  const resetCrosshairs = evt => {
    const { element } = evt.detail;
    const { viewportId, renderingEngineId } = cornerstone.getEnabledElement(element);

    const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroupForViewport(
      viewportId,
      renderingEngineId
    );

    if (!toolGroup || !toolGroup._toolInstances?.['Crosshairs']) {
      return;
    }

    const mode = toolGroup._toolInstances['Crosshairs'].mode;

    if (mode === Enums.ToolModes.Active) {
      toolGroup.setToolActive('Crosshairs');
    } else if (mode === Enums.ToolModes.Passive) {
      toolGroup.setToolPassive('Crosshairs');
    } else if (mode === Enums.ToolModes.Enabled) {
      toolGroup.setToolEnabled('Crosshairs');
    }
  };

  eventTarget.addEventListener(EVENTS.STACK_VIEWPORT_NEW_STACK, evt => {
    const { element, imageIds } = evt.detail;
    const { viewportId } = cornerstone.getEnabledElement(element);
    stackPrefetch.enable({ uid: viewportId, imageIds }, priorityCounter--);
  });
  eventTarget.addEventListener(EVENTS.IMAGE_LOAD_FAILED, imageLoadFailedHandler);
  eventTarget.addEventListener(EVENTS.IMAGE_LOAD_ERROR, imageLoadFailedHandler);

  function elementEnabledHandler(evt) {
    enabledElementCounter++;
    if (enabledElementCounter === cornerstone.getEnabledElements().length) {
      const dataSource = extensionManager.getActiveDataSource()[0];
      const { viewports } = viewportGridService.getState();

      const viewportDisplaySetIds = [];
      viewports.forEach(viewport => {
        viewport.displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
          viewportDisplaySetIds.push(displaySetInstanceUID);
        });
      });

      const viewportInfos = Array.from(viewports.values());

      const displaySet = displaySetService.getDisplaySetByUID(
        viewportInfos[0].displaySetInstanceUIDs[0]
      );
      const { StudyInstanceUID } = displaySet;

      displaySetService
        .getActiveDisplaySets()
        .filter(
          ds =>
            ds.StudyInstanceUID === StudyInstanceUID &&
            !viewportDisplaySetIds.includes(ds.displaySetInstanceUID)
        )
        .sort((a, b) => a.SeriesNumber - b.SeriesNumber)
        .filter(ds => !STUDY_STACKS.some(stack => stack.uid === ds.displaySetInstanceUID))
        .forEach((displaySet, index) => {
          const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
          STUDY_STACKS.push({
            uid: displaySet.displaySetInstanceUID,
            imageIds,
          });
        });

      setTimeout(() => {
        console.log('All elements are enabled. Start prefetching images.');
        STUDY_STACKS.forEach(stack => stackPrefetch.enable(stack, priorityCounter));
      }, 2000);

      eventTarget.removeEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler);
    }
    const { element } = evt.detail;

    element.addEventListener(EVENTS.CAMERA_RESET, resetCrosshairs);

    eventTarget.addEventListener(EVENTS.STACK_VIEWPORT_NEW_STACK, toolbarEventListener);

    initViewTiming({ element, eventTarget });
  }

  function elementDisabledHandler(evt) {
    const { element } = evt.detail;

    element.removeEventListener(EVENTS.CAMERA_RESET, resetCrosshairs);

    // TODO - consider removing the callback when all elements are gone
    // eventTarget.removeEventListener(
    //   EVENTS.STACK_VIEWPORT_NEW_STACK,
    //   newStackCallback
    // );

    enabledElementCounter = 0;
    STUDY_STACKS = [];
  }

  eventTarget.addEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler);

  eventTarget.addEventListener(EVENTS.ELEMENT_DISABLED, elementDisabledHandler);

  viewportGridService.subscribe(
    viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
    activeViewportEventListener
  );
}

function CPUModal() {
  return (
    <div>
      <p>
        Your computer does not have enough GPU power to support the default GPU rendering mode. OHIF
        has switched to CPU rendering mode. Please note that CPU rendering does not support all
        features such as Volume Rendering, Multiplanar Reconstruction, and Segmentation Overlays.
      </p>
    </div>
  );
}

function _showCPURenderingModal(uiModalService, hangingProtocolService) {
  const callback = progress => {
    if (progress === 100) {
      uiModalService.show({
        content: CPUModal,
        title: 'OHIF Fell Back to CPU Rendering',
      });

      return true;
    }
  };

  const { unsubscribe } = hangingProtocolService.subscribe(
    hangingProtocolService.EVENTS.PROTOCOL_CHANGED,
    () => {
      const done = callback(100);

      if (done) {
        unsubscribe();
      }
    }
  );
}
