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
  decimatedVolumeLoader,
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

// Constants
const DEFAULT_SAMPLE_DISTANCE_MULTIPLIER = 1;
const MIN_SAMPLE_DISTANCE_MULTIPLIER = 1;
const DEFAULT_ROTATE_SAMPLE_DISTANCE_FACTOR = 6;
const MIN_ROTATE_SAMPLE_DISTANCE_FACTOR = 1;

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

  cornerstone.setUseCPURendering(Boolean(appConfig.useCPURendering));

  const savedSampling = localStorage.getItem('volumeRenderingSampling');
  const savedRotateSampleDistanceFactor = localStorage.getItem('rotateSampleDistanceFactor');

  const cornerstoneConfig = appConfig?.cornerstoneConfiguration || {};
  const volumeRenderingConfig = cornerstoneConfig?.rendering?.volumeRendering || {};
  const toolsConfig = cornerstoneConfig?.tools || {};

  let sampleDistanceMultiplier =
    savedSampling !== null
      ? Number(savedSampling)
      : volumeRenderingConfig.sampleDistanceMultiplier !== undefined
        ? volumeRenderingConfig.sampleDistanceMultiplier
        : DEFAULT_SAMPLE_DISTANCE_MULTIPLIER;
  if (sampleDistanceMultiplier < MIN_SAMPLE_DISTANCE_MULTIPLIER) {
    sampleDistanceMultiplier = MIN_SAMPLE_DISTANCE_MULTIPLIER;
  }

  const rotateSampleDistanceFactor = savedRotateSampleDistanceFactor !== null
    ? Math.max(MIN_ROTATE_SAMPLE_DISTANCE_FACTOR, Number(savedRotateSampleDistanceFactor))
    : toolsConfig.rotateSampleDistanceFactor !== undefined
      ? Math.max(MIN_ROTATE_SAMPLE_DISTANCE_FACTOR, toolsConfig.rotateSampleDistanceFactor)
      : DEFAULT_ROTATE_SAMPLE_DISTANCE_FACTOR;

  if (!window.config) {
    (window as any).config = {};
  }
  if (!window.config.cornerstoneConfiguration) {
    window.config.cornerstoneConfiguration = {};
  }
  if (!window.config.cornerstoneConfiguration.tools) {
    window.config.cornerstoneConfiguration.tools = {};
  }
  window.config.cornerstoneConfiguration.tools.rotateSampleDistanceFactor = rotateSampleDistanceFactor;

  cornerstone.setConfiguration({
    ...cornerstone.getConfiguration(),
    rendering: {
      ...cornerstone.getConfiguration().rendering,
      strictZSpacingForVolumeViewport: appConfig.strictZSpacingForVolumeViewport,
      volumeRendering: {
        sampleDistanceMultiplier: sampleDistanceMultiplier,
      },
    },
  });

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
    'decimatedVolumeLoader',
    (volumeId: string, options: any) => {
      return decimatedVolumeLoader(volumeId, options);
    }
  );

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    (volumeId: string, options: any) => {
      return decimatedVolumeLoader(volumeId, options);
    }
  );

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingDynamicImageVolume',
    cornerstoneStreamingDynamicImageVolumeLoader  // Keep dynamic loader as-is for now
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

    /**
   * Gets the display set from a volume ID.
   *
   * Volume ID format: {loaderScheme}:{displaySetInstanceUID} or {loaderScheme}:{displaySetInstanceUID}:{suffix}
   *
   * @example
   * decimatedVolumeLoader:8d5829ce-e334-9ed0-6c81-ee6e9fbb9e58:volume3d
   *
   * @param volumeId - The volume ID string to parse
   * @returns The display set matching the volume ID, or undefined if not found
   */
  const getDisplaySetFromVolumeId = (volumeId: string) => {
    const parts = volumeId.split(':');
    if (parts.length >= 2) {
      const displaySetInstanceUID = parts[1];
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      if (displaySet) {
        return displaySet;
      }
    }

    const allDisplaySets = displaySetService.getActiveDisplaySets();
    const volume = cornerstone.cache.getVolume(volumeId);
    if (!volume || !volume.imageIds) {
      return undefined;
    }
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

    /**
   * Handles volume loaded events to update display set with actual decimated image count.
   *
   * When a volume is loaded, this listener updates the display set's numImageFrames
   * attribute with the actual number of image IDs in the volume, which may differ
   * from the initial count due to decimation during loading.
   *
   * @param evt - The volume loaded event containing the volume details
   */
  const volumeLoadedHandler = (evt) => {
    const { volume } = evt.detail;

    if (!volume || !volume.volumeId || !volume.imageIds) {
      console.warn('Volume loaded but missing required properties');
      return;
    }

    const displaySet = getDisplaySetFromVolumeId(volume.volumeId);

    if (!displaySet) {
      console.warn('No displaySet found for volume:', volume.volumeId);
      return;
    }
    const actualImageCount = volume.imageIds.length;
    const dsAny = displaySet as any;
    if (dsAny.numImageFrames !== actualImageCount && typeof dsAny.setAttributes === 'function') {

      dsAny.setAttributes({
        numImageFrames: actualImageCount,
      });

      displaySetService._broadcastEvent(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        displaySetService.getActiveDisplaySets()
      );

    }
  };

  eventTarget.addEventListener(EVENTS.VOLUME_LOADED, volumeLoadedHandler);

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

    try {
      const result = strategyFn(args);
      return result;
    } finally {
      // Ensure metadata is always restored, even if there's an error
      setTimeout(() => {
        imageRetrieveMetadataProvider.clear();
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
