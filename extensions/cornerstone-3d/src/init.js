import OHIF from '@ohif/core';
import { ContextMenuMeasurements } from '@ohif/ui';

import * as cornerstone3D from '@cornerstonejs/core';
import {
  init as cs3DInit,
  eventTarget,
  EVENTS,
  imageLoadPoolManager,
  Settings,
} from '@cornerstonejs/core';
import { Enums, utilities } from '@cornerstonejs/tools';

import initWADOImageLoader from './initWADOImageLoader';
import Cornerstone3DViewportService from './services/ViewportService/Cornerstone3DViewportService';
import initCornerstoneTools from './initCornerstoneTools';

import { connectToolsToMeasurementService } from './initMeasurementService';
import callInputDialog from './callInputDialog';
import initCineService from './initCineService';

const cs3DToolsEvents = Enums.Events;

let CONTEXT_MENU_OPEN = false;

// TODO: Cypress tests are currently grabbing this from the window?
window.cornerstone = cornerstone3D;
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
  initCornerstoneTools();

  // Don't use cursors in viewports
  Settings.getRuntimeSettings().set('useCursors', false);

  const {
    UserAuthenticationService,
    ToolGroupService,
    MeasurementService,
    DisplaySetService,
    UIDialogService,
    CineService,
  } = servicesManager.services;

  const metadataProvider = OHIF.classes.MetadataProvider;

  cornerstone3D.metaData.addProvider(
    metadataProvider.get.bind(metadataProvider),
    9999
  );

  imageLoadPoolManager.maxNumRequests = {
    interaction: 100,
    thumbnail: 75,
    prefetch: 20,
  };

  initWADOImageLoader(UserAuthenticationService, appConfig);

  /* Measurement Service */
  const measurementServiceSource = connectToolsToMeasurementService(
    MeasurementService,
    DisplaySetService,
    Cornerstone3DViewportService
  );

  initCineService(CineService);

  const _getDefaultPosition = event => ({
    x: (event && event.currentPoints.client[0]) || 0,
    y: (event && event.currentPoints.client[1]) || 0,
  });

  const onRightClick = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    const onGetMenuItems = defaultMenuItems => {
      const { element, currentPoints } = event.detail;

      const nearbyToolData = utilities.getAnnotationNearPoint(
        element,
        currentPoints.canvas
      );

      let menuItems = [];
      if (nearbyToolData) {
        defaultMenuItems.forEach(item => {
          item.value = nearbyToolData;
          item.element = element;
          menuItems.push(item);
        });
      }

      return menuItems;
    };

    CONTEXT_MENU_OPEN = true;

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      defaultPosition: _getDefaultPosition(event.detail),
      content: ContextMenuMeasurements,
      onClickOutside: () => {
        UIDialogService.dismiss({ id: 'context-menu' });
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
          UIDialogService.dismiss({ id: 'context-menu' });
        },
        onSetLabel: item => {
          const { annotationUID } = item.value;

          const measurement = MeasurementService.getMeasurement(annotationUID);

          callInputDialog(
            UIDialogService,
            measurement,
            (label, actionId) => {
              if (actionId === 'cancel') {
                return;
              }

              const updatedMeasurement = Object.assign({}, measurement, {
                label,
              });

              MeasurementService.update(
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
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    CONTEXT_MENU_OPEN = false;

    UIDialogService.dismiss({ id: 'context-menu' });
  };

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

  function elementEnabledHandler(evt) {
    const { element } = evt.detail;

    element.addEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );
  }

  function elementDisabledHandler(evt) {
    const { viewportId, element } = evt.detail;

    const viewportInfo = Cornerstone3DViewportService.getViewportInfoById(
      viewportId
    );
    ToolGroupService.disable(viewportInfo);

    element.removeEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );
  }

  eventTarget.addEventListener(
    EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null)
  );

  eventTarget.addEventListener(
    EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler.bind(null)
  );
}
