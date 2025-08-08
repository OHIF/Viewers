import OHIF, { errorHandler } from '@ohif/core';
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
  getEnabledElement,
  Settings,
  utilities as csUtilities,
} from '@cornerstonejs/core';
import {
  cornerstoneStreamingImageVolumeLoader,
  cornerstoneStreamingDynamicImageVolumeLoader,
} from '@cornerstonejs/core/loaders';

import RequestTypes from '@cornerstonejs/core/enums/RequestType';

import initWADOImageLoader from './initWADOImageLoader';
import initCornerstoneTools from './initCornerstoneTools';

import { connectToolsToMeasurementService } from './initMeasurementService';
import initCineService from './initCineService';
import initStudyPrefetcherService from './initStudyPrefetcherService';
import interleaveCenterLoader from './utils/interleaveCenterLoader';
import nthLoader from './utils/nthLoader';
import interleaveTopToBottom from './utils/interleaveTopToBottom';
import initContextMenu from './initContextMenu';
import initDoubleClick from './initDoubleClick';
import initViewTiming from './utils/initViewTiming';
import { colormaps } from './utils/colormaps';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { useLutPresentationStore } from './stores/useLutPresentationStore';
import { usePositionPresentationStore } from './stores/usePositionPresentationStore';
import { useSegmentationPresentationStore } from './stores/useSegmentationPresentationStore';
import { imageRetrieveMetadataProvider } from '@cornerstonejs/core/utilities';
import { initializeWebWorkerProgressHandler } from './utils/initWebWorkerProgressHandler';

const { registerColormap } = csUtilities.colormap;

// TODO: Cypress tests are currently grabbing this from the window?
(window as any).cornerstone = cornerstone;
(window as any).cornerstoneTools = cornerstoneTools;
/**
 *
 */
export default async function init({
  servicesManager,
  commandsManager,
  extensionManager,
  appConfig,
}: withAppTypes): Promise<void> {
  // Use a public library path of PUBLIC_URL plus the component name
  // This safely separates components that are loaded as-is.
  window.PUBLIC_LIB_URL ||= './${component}/';

  // Note: this should run first before initializing the cornerstone
  // DO NOT CHANGE THE ORDER

  await cs3DInit({
    peerImport: appConfig.peerImport,
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
    uiModalService,
    uiNotificationService,
    cornerstoneViewportService,
    hangingProtocolService,
    viewportGridService,
    segmentationService,
    measurementService,
    colorbarService,
    displaySetService,
    toolbarService,
  } = servicesManager.services;

  toolbarService.registerEventForToolbarUpdate(colorbarService, [
    colorbarService.EVENTS.STATE_CHANGED,
  ]);

  window.services = servicesManager.services;
  window.extensionManager = extensionManager;
  window.commandsManager = commandsManager;

  if (appConfig.showCPUFallbackMessage && cornerstone.getShouldUseCPURendering()) {
    _showCPURenderingModal(uiModalService, hangingProtocolService);
  }
  const { getPresentationId: getLutPresentationId } = useLutPresentationStore.getState();

  const { getPresentationId: getSegmentationPresentationId } =
    useSegmentationPresentationStore.getState();

  const { getPresentationId: getPositionPresentationId } = usePositionPresentationStore.getState();

  // register presentation id providers
  viewportGridService.addPresentationIdProvider(
    'positionPresentationId',
    getPositionPresentationId
  );
  viewportGridService.addPresentationIdProvider('lutPresentationId', getLutPresentationId);
  viewportGridService.addPresentationIdProvider(
    'segmentationPresentationId',
    getSegmentationPresentationId
  );

  cornerstoneTools.segmentation.config.style.setStyle(
    { type: SegmentationRepresentations.Contour },
    {
      renderFill: false,
    }
  );

  const metadataProvider = OHIF.classes.MetadataProvider;

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingDynamicImageVolume',
    cornerstoneStreamingDynamicImageVolumeLoader
  );

  // Register strategies using the wrapper
  const imageLoadStrategies = {
    interleaveCenter: interleaveCenterLoader,
    interleaveTopToBottom: interleaveTopToBottom,
    nth: nthLoader,
  };

  Object.entries(imageLoadStrategies).forEach(([name, strategyFn]) => {
    hangingProtocolService.registerImageLoadStrategy(
      name,
      createMetadataWrappedStrategy(strategyFn)
    );
  });

  // add metadata providers
  metaData.addProvider(
    csUtilities.calibratedPixelSpacingMetadataProvider.get.bind(
      csUtilities.calibratedPixelSpacingMetadataProvider
    )
  ); // this provider is required for Calibration tool
  metaData.addProvider(metadataProvider.get.bind(metadataProvider), 9999);

  // These are set reasonably low to allow for interleaved retrieves and slower
  // connections.
  imageLoadPoolManager.maxNumRequests = {
    [RequestTypes.Interaction]: appConfig?.maxNumRequests?.interaction || 10,
    [RequestTypes.Thumbnail]: appConfig?.maxNumRequests?.thumbnail || 5,
    [RequestTypes.Prefetch]: appConfig?.maxNumRequests?.prefetch || 5,
    [RequestTypes.Compute]: appConfig?.maxNumRequests?.compute || 10,
  };

  initWADOImageLoader(userAuthenticationService, appConfig, extensionManager);

  /* Measurement Service */
  this.measurementServiceSource = connectToolsToMeasurementService({
    servicesManager,
    commandsManager,
    extensionManager,
  });

  initCineService(servicesManager);
  initStudyPrefetcherService(servicesManager);

  measurementService.subscribe(measurementService.EVENTS.JUMP_TO_MEASUREMENT, evt => {
    const { measurement } = evt;
    const { uid: annotationUID } = measurement;
    commandsManager.runCommand('jumpToMeasurementViewport', { measurement, annotationUID, evt });
  });

  // When a custom image load is performed, update the relevant viewports
  hangingProtocolService.subscribe(
    hangingProtocolService.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED,
    volumeInputArrayMap => {
      const { lutPresentationStore } = useLutPresentationStore.getState();
      const { segmentationPresentationStore } = useSegmentationPresentationStore.getState();
      const { positionPresentationStore } = usePositionPresentationStore.getState();

      for (const entry of volumeInputArrayMap.entries()) {
        const [viewportId, volumeInputArray] = entry;
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        const ohifViewport = cornerstoneViewportService.getViewportInfo(viewportId);

        const { presentationIds } = ohifViewport.getViewportOptions();

        const presentations = {
          positionPresentation: positionPresentationStore[presentationIds?.positionPresentationId],
          lutPresentation: lutPresentationStore[presentationIds?.lutPresentationId],
          segmentationPresentation:
            segmentationPresentationStore[presentationIds?.segmentationPresentationId],
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

  /**
   * Runs error handler for failed requests.
   * @param event
   */
  const imageLoadFailedHandler = ({ detail }) => {
    const handler = errorHandler.getHTTPErrorHandler();
    handler(detail.error);
  };

  eventTarget.addEventListener(EVENTS.IMAGE_LOAD_FAILED, imageLoadFailedHandler);
  eventTarget.addEventListener(EVENTS.IMAGE_LOAD_ERROR, imageLoadFailedHandler);

  const getDisplaySetFromVolumeId = (volumeId: string) => {
    const allDisplaySets = displaySetService.getActiveDisplaySets();
    const volume = cornerstone.cache.getVolume(volumeId);
    const imageIds = volume.imageIds;
    return allDisplaySets.find(ds => ds.imageIds?.some(id => imageIds.includes(id)));
  };

  function elementEnabledHandler(evt) {
    const { element } = evt.detail;
    const { viewport } = getEnabledElement(element);
    initViewTiming({ element });

    element.addEventListener(EVENTS.CAMERA_RESET, evt => {
      const { element } = evt.detail;
      const enabledElement = getEnabledElement(element);
      if (!enabledElement) {
        return;
      }
      const { viewportId } = enabledElement;
      commandsManager.runCommand('resetCrosshairs', { viewportId });
    });

    // limitation: currently supporting only volume viewports with fusion
    if (viewport.type !== cornerstone.Enums.ViewportType.ORTHOGRAPHIC) {
      return;
    }
  }

  eventTarget.addEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler.bind(null));

  colormaps.forEach(registerColormap);

  // Event listener
  eventTarget.addEventListenerDebounced(
    EVENTS.ERROR_EVENT,
    ({ detail }) => {
      // Create a stable ID for deduplication based on error type and message
      const errorId = `cornerstone-error-${detail.type}-${detail.message.substring(0, 50)}`;

      uiNotificationService.show({
        title: detail.type,
        message: detail.message,
        type: 'error',
        id: errorId,
        allowDuplicates: false, // Prevent duplicate error notifications
        deduplicationInterval: 30000, // 30 seconds deduplication window
      });
    },
    100
  );

  // Subscribe to actor events to dynamically update colorbars

  // Call this function when initializing
  initializeWebWorkerProgressHandler(servicesManager.services.uiNotificationService);
}

/**
 * Creates a wrapped image load strategy with metadata handling
 * @param strategyFn - The image loading strategy function to wrap
 * @returns A wrapped strategy function that handles metadata configuration
 */
const createMetadataWrappedStrategy = (strategyFn: (args: any) => any) => {
  return (args: any) => {
    const clonedConfig = imageRetrieveMetadataProvider.clone();
    imageRetrieveMetadataProvider.clear();

    try {
      const result = strategyFn(args);
      return result;
    } finally {
      // Ensure metadata is always restored, even if there's an error
      setTimeout(() => {
        imageRetrieveMetadataProvider.restore(clonedConfig);
      }, 10);
    }
  };
};

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
