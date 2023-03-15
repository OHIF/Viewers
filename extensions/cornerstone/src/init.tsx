import OHIF from '@ohif/core';
import React from 'react';
import { ContextMenuMeasurements } from '@ohif/ui';

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
} from '@cornerstonejs/core';
import { Enums, utilities, ReferenceLinesTool } from '@cornerstonejs/tools';
import { cornerstoneStreamingImageVolumeLoader } from '@cornerstonejs/streaming-image-volume-loader';

import initWADOImageLoader from './initWADOImageLoader';
import initCornerstoneTools from './initCornerstoneTools';

import { connectToolsToMeasurementService } from './initMeasurementService';
import callInputDialog from './utils/callInputDialog';
import initCineService from './initCineService';
import interleaveCenterLoader from './utils/interleaveCenterLoader';
import nthLoader from './utils/nthLoader';
import interleaveTopToBottom from './utils/interleaveTopToBottom';

const cs3DToolsEvents = Enums.Events;

let CONTEXT_MENU_OPEN = false;

// TODO: Cypress tests are currently grabbing this from the window?
window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;
/**
 *
 */
export default async function init({
  servicesManager,
  commandsManager,
  configuration,
  appConfig,
}) {
  await cs3DInit();

  // For debugging e2e tests that are failing on CI
  cornerstone.setUseCPURendering(Boolean(appConfig.useCPURendering));

  // For debugging large datasets
  const MAX_CACHE_SIZE_1GB = 1073741824;
  const maxCacheSize = appConfig.maxCacheSize;
  cornerstone.cache.setMaxCacheSize(
    maxCacheSize ? maxCacheSize : MAX_CACHE_SIZE_1GB
  );

  initCornerstoneTools();

  Settings.getRuntimeSettings().set(
    'useCursors',
    Boolean(appConfig.useCursors)
  );

  const {
    userAuthenticationService,
    measurementService,
    displaySetService,
    uiDialogService,
    uiModalService,
    uiNotificationService,
    cineService,
    cornerstoneViewportService,
    hangingProtocolService,
    toolGroupService,
    viewportGridService,
    stateSyncService,
  } = servicesManager.services;

  window.services = servicesManager.services;

  if (
    appConfig.showWarningMessageForCrossOrigin &&
    !window.crossOriginIsolated
  ) {
    uiNotificationService.show({
      title: 'Cross Origin Isolation',
      message:
        'Cross Origin Isolation is not enabled, volume rendering will not work (e.g., MPR)',
      type: 'warning',
    });
  }

  if (
    appConfig.showCPUFallbackMessage &&
    cornerstone.getShouldUseCPURendering()
  ) {
    _showCPURenderingModal(uiModalService, hangingProtocolService);
  }

  // Stores a map from `presentationId` to a Presentation object so that
  // an OHIFCornerstoneViewport can be redisplayed with the same attributes
  stateSyncService.register('presentationSync', { clearOnModeExit: true });

  const labelmapRepresentation =
    cornerstoneTools.Enums.SegmentationRepresentations.Labelmap;

  cornerstoneTools.segmentation.config.setGlobalRepresentationConfig(
    labelmapRepresentation,
    {
      fillAlpha: 0.3,
      fillAlphaInactive: 0.2,
      outlineOpacity: 1,
      outlineOpacityInactive: 0.65,
    }
  );

  const metadataProvider = OHIF.classes.MetadataProvider;

  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader
  );

  hangingProtocolService.registerImageLoadStrategy(
    'interleaveCenter',
    interleaveCenterLoader
  );
  hangingProtocolService.registerImageLoadStrategy(
    'interleaveTopToBottom',
    interleaveTopToBottom
  );
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

  initWADOImageLoader(userAuthenticationService, appConfig);

  /* Measurement Service */
  const measurementServiceSource = connectToolsToMeasurementService(
    servicesManager
  );

  initCineService(cineService);

  const _getDefaultPosition = event => ({
    x: (event && event.currentPoints.client[0]) || 0,
    y: (event && event.currentPoints.client[1]) || 0,
  });

  const onRightClick = event => {
    if (!uiDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    const onGetMenuItems = defaultMenuItems => {
      const { element, currentPoints } = event.detail;

      const nearbyToolData = utilities.getAnnotationNearPoint(
        element,
        currentPoints.canvas
      );

      const menuItems = [];
      if (nearbyToolData && nearbyToolData.metadata.toolName !== 'Crosshairs') {
        defaultMenuItems.forEach(item => {
          item.value = nearbyToolData;
          item.element = element;
          menuItems.push(item);
        });
      }

      return menuItems;
    };

    CONTEXT_MENU_OPEN = true;

    uiDialogService.dismiss({ id: 'context-menu' });
    uiDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      defaultPosition: _getDefaultPosition(event.detail),
      content: ContextMenuMeasurements,
      onClickOutside: () => {
        uiDialogService.dismiss({ id: 'context-menu' });
        CONTEXT_MENU_OPEN = false;
      },
      contentProps: {
        onGetMenuItems,
        eventData: event.detail,
        onDelete: item => {
          const { annotationUID } = item.value;

          const uid = annotationUID;
          // Sync'd w/ Measurement Service
          if (uid) {
            measurementServiceSource.remove(uid, {
              element: item.element,
            });
          }
          CONTEXT_MENU_OPEN = false;
        },
        onClose: () => {
          CONTEXT_MENU_OPEN = false;
          uiDialogService.dismiss({ id: 'context-menu' });
        },
        onSetLabel: item => {
          const { annotationUID } = item.value;

          const measurement = measurementService.getMeasurement(annotationUID);

          callInputDialog(
            uiDialogService,
            measurement,
            (label, actionId) => {
              if (actionId === 'cancel') {
                return;
              }

              const updatedMeasurement = Object.assign({}, measurement, {
                label,
              });

              measurementService.update(
                updatedMeasurement.uid,
                updatedMeasurement,
                true
              );
            },
            false
          );

          CONTEXT_MENU_OPEN = false;
        },
      },
    });
  };

  const resetContextMenu = () => {
    if (!uiDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    CONTEXT_MENU_OPEN = false;

    uiDialogService.dismiss({ id: 'context-menu' });
  };

  // When a custom image load is performed, update the relevant viewports
  hangingProtocolService.subscribe(
    hangingProtocolService.EVENTS.CUSTOM_IMAGE_LOAD_PERFORMED,
    volumeInputArrayMap => {
      for (const entry of volumeInputArrayMap.entries()) {
        const [viewportId, volumeInputArray] = entry;
        const viewport = cornerstoneViewportService.getCornerstoneViewport(
          viewportId
        );

        cornerstoneViewportService.setVolumesForViewport(
          viewport,
          volumeInputArray
        );
      }
    }
  );

  /*
   * Because click gives us the native "mouse up", buttons will always be `0`
   * Need to fallback to event.which;
   *
   */
  const contextMenuHandleClick = evt => {
    const mouseUpEvent = evt.detail.event;
    const isRightClick = mouseUpEvent.which === 3;

    const clickMethodHandler = isRightClick ? onRightClick : resetContextMenu;
    clickMethodHandler(evt);
  };

  // const cancelContextMenuIfOpen = evt => {
  //   if (CONTEXT_MENU_OPEN) {
  //     resetContextMenu();
  //   }
  // };

  const newStackCallback = evt => {
    const { element } = evt.detail;
    utilities.stackPrefetch.enable(element);
  };

  const resetCrosshairs = evt => {
    const { element } = evt.detail;
    const { viewportId, renderingEngineId } = cornerstone.getEnabledElement(
      element
    );

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

  function elementEnabledHandler(evt) {
    const { element } = evt.detail;

    element.addEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );

    element.addEventListener(EVENTS.CAMERA_RESET, resetCrosshairs);

    eventTarget.addEventListener(
      EVENTS.STACK_VIEWPORT_NEW_STACK,
      newStackCallback
    );
  }

  function elementDisabledHandler(evt) {
    const { element } = evt.detail;

    element.removeEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );

    element.removeEventListener(EVENTS.CAMERA_RESET, resetCrosshairs);

    // TODO - consider removing the callback when all elements are gone
    // eventTarget.removeEventListener(
    //   EVENTS.STACK_VIEWPORT_NEW_STACK,
    //   newStackCallback
    // );
  }

  eventTarget.addEventListener(
    EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null)
  );

  eventTarget.addEventListener(
    EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler.bind(null)
  );

  viewportGridService.subscribe(
    viewportGridService.EVENTS.ACTIVE_VIEWPORT_INDEX_CHANGED,
    ({ viewportIndex, viewportId }) => {
      viewportId = viewportId || `viewport-${viewportIndex}`;
      const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

      if (!toolGroup || !toolGroup._toolInstances?.['ReferenceLines']) {
        return;
      }

      // check if reference lines are active
      const referenceLinesEnabled =
        toolGroup._toolInstances['ReferenceLines'].mode ===
        Enums.ToolModes.Enabled;

      if (!referenceLinesEnabled) {
        return;
      }

      toolGroup.setToolConfiguration(
        ReferenceLinesTool.toolName,
        {
          sourceViewportId: viewportId,
        },
        true // overwrite
      );

      // make sure to set it to enabled again since we want to recalculate
      // the source-target lines
      toolGroup.setToolEnabled(ReferenceLinesTool.toolName);
    }
  );
}

function CPUModal() {
  return (
    <div>
      <p>
        Your computer does not have enough GPU power to support the default GPU
        rendering mode. OHIF has switched to CPU rendering mode. Please note
        that CPU rendering does not support all features such as Volume
        Rendering, Multiplanar Reconstruction, and Segmentation Overlays.
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
