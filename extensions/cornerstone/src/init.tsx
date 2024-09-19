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
  getEnabledElement,
  Settings,
  utilities as csUtilities,
} from '@cornerstonejs/core';
import {
  cornerstoneStreamingImageVolumeLoader,
  cornerstoneStreamingDynamicImageVolumeLoader,
} from '@cornerstonejs/core/loaders';

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
import getPositionPresentationId from './utils/presentations/getPositionPresentationId';
import getLutPresentationId from './utils/presentations/getLutPresentationId';
import getSegmentationPresentationId from './utils/presentations/getSegmentationPresentationId';

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
  // Note: this should run first before initializing the cornerstone
  // DO NOT CHANGE THE ORDER

  await cs3DInit({
    rendering: {
      preferSizeOverAccuracy: Boolean(appConfig.preferSizeOverAccuracy),
      useNorm16Texture: Boolean(appConfig.useNorm16Texture),
    },
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
    stateSyncService,
  } = servicesManager.services;

  window.services = servicesManager.services;
  window.extensionManager = extensionManager;
  window.commandsManager = commandsManager;

  if (appConfig.showCPUFallbackMessage && cornerstone.getShouldUseCPURendering()) {
    _showCPURenderingModal(uiModalService, hangingProtocolService);
  }

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

  // Stores a map from `lutPresentationId` to a Presentation object so that
  // an OHIFCornerstoneViewport can be redisplayed with the same LUT
  stateSyncService.register('lutPresentationStore', { clearOnModeExit: true });

  // Stores synchronizers state to be restored
  stateSyncService.register('synchronizersStore', { clearOnModeExit: true });

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

  // Register a map for segmentationPresentationId. This ID is used to
  // store the segmentation representation for a viewport. When elements
  // move around, the stateSyncService ensures the segmentation representation
  // is rendered correctly. This applies to scenarios like stack-to-volume
  // viewport transitions or new viewport creation that previously had
  // the segmentation representation.
  stateSyncService.register('segmentationPresentationStore', {
    clearOnModeExit: true,
  });

  cornerstoneTools.segmentation.config.style.setGlobalLabelmapStyle({
    fillAlpha: 0.5,
    fillAlphaInactive: 0.2,
    outlineOpacity: 1,
    outlineOpacityInactive: 0.65,
  });

  cornerstoneTools.segmentation.config.style.setGlobalContourStyle({
    renderFill: false,
  });

  const metadataProvider = OHIF.classes.MetadataProvider;

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingDynamicImageVolume',
    cornerstoneStreamingDynamicImageVolumeLoader
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

  // These are set reasonably low to allow for interleaved retrieves and slower
  // connections.
  imageLoadPoolManager.maxNumRequests = {
    interaction: appConfig?.maxNumRequests?.interaction || 10,
    thumbnail: appConfig?.maxNumRequests?.thumbnail || 5,
    prefetch: appConfig?.maxNumRequests?.prefetch || 5,
    compute: appConfig?.maxNumRequests?.compute || 10,
  };

  initWADOImageLoader(userAuthenticationService, appConfig, extensionManager);

  /* Measurement Service */
  this.measurementServiceSource = connectToolsToMeasurementService(servicesManager);

  initCineService(servicesManager);
  initStudyPrefetcherService(servicesManager);

  // When a custom image load is performed, update the relevant viewports
  hangingProtocolService.subscribe(
    hangingProtocolService.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED,
    volumeInputArrayMap => {
      for (const entry of volumeInputArrayMap.entries()) {
        const [viewportId, volumeInputArray] = entry;
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        const ohifViewport = cornerstoneViewportService.getViewportInfo(viewportId);

        const { lutPresentationStore, positionPresentationStore, segmentationPresentationStore } =
          stateSyncService.getState();
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

  // resize the cornerstone viewport service when the grid size changes
  // IMPORTANT: this should happen outside of the OHIFCornerstoneViewport
  // since it will trigger a rerender of each viewport and each resizing
  // the offscreen canvas which would result in a performance hit, this should
  // done only once per grid resize here. Doing it once here, allows us to reduce
  // the refreshRage(in ms) to 10 from 50. I tried with even 1 or 5 ms it worked fine
  viewportGridService.subscribe(viewportGridService.EVENTS.GRID_SIZE_CHANGED, () => {
    cornerstoneViewportService.resize(true);
  });

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

  function elementEnabledHandler(evt) {
    const { element } = evt.detail;

    element.addEventListener(EVENTS.CAMERA_RESET, evt => {
      const { element } = evt.detail;
      const enabledElement = getEnabledElement(element);
      if (!enabledElement) {
        return;
      }
      const { viewportId } = enabledElement;
      commandsManager.runCommand('resetCrosshairs', { viewportId });
    });

    initViewTiming({ element });
  }

  eventTarget.addEventListener(EVENTS.ELEMENT_ENABLED, elementEnabledHandler.bind(null));

  colormaps.forEach(registerColormap);

  // Event listener
  eventTarget.addEventListenerDebounced(
    EVENTS.ERROR_EVENT,
    ({ detail }) => {
      uiNotificationService.show({
        title: detail.type,
        message: detail.message,
        type: 'error',
      });
    },
    100
  );

  const segRepAdded = segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED;
  const segRepRemoved = segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_REMOVED;
  const gridStateChange = viewportGridService.EVENTS.GRID_STATE_CHANGED;

  const consolidateSegmentationRepresentations = () => {
    const gridState = viewportGridService.getState();
    const viewports = gridState.viewports as AppTypes.ViewportGrid.Viewports;
    if (!viewports || viewports.size === 0) {
      return;
    }

    const segmentations = segmentationService.getSegmentationRepresentations();
    for (const [viewportId, gridViewport] of viewports.entries()) {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      if (!viewport) {
        continue;
      }

      // get the overlay rule for this viewport from the hanging protocol
      const { matchingRules: overlayRule, overlay } =
        hangingProtocolService.getOverlayRuleForViewport(viewportId) || {};
      if (!overlayRule?.length || !segmentations?.length) {
        continue;
      }

      for (const segmentation of segmentations) {
        const matched = hangingProtocolService.runMatchingRules(segmentation, overlayRule, {
          viewport: {
            FrameOfReferenceUID: viewport.getFrameOfReferenceUID(),
          },
          segmentation: {
            FrameOfReferenceUID: segmentation.FrameOfReferenceUID,
          },
        });

        if (!matched || matched.score === 0 || matched.requiredFailed) {
          continue;
        }

        const matchSuccess = matched.details.passed.length > 0;
        const representations =
          segmentationService.getSegmentationRepresentationsForViewport(viewportId);
        const alreadyHasRepresentation = representations.some(
          representation => representation.segmentationId === segmentation.id
        );

        if (matchSuccess && !alreadyHasRepresentation) {
          segmentationService.addSegmentationRepresentationToViewport({
            viewportId,
            segmentationId: segmentation.id,
            useExistingRepresentationIfExist: true,
          });
        }
      }
    }

    // here we need to go over all the viewports and check if the overlay rules
    // actually match the segmentation representation that was added or removed
    // if so the viewport should be updated with that segmentation representation
    // so that the overlay is visible or hidden accordingly
  };

  // viewportGridService.subscribe(gridStateChange, consolidateSegmentationRepresentations);
  // cornerstoneViewportService.subscribe(
  //   cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
  //   consolidateSegmentationRepresentations
  // );

  // [segRepAdded].forEach(event => {
  //   segmentationService.subscribe(event, consolidateSegmentationRepresentations);
  // });
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
