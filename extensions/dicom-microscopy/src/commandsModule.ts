import microscopyManager from './tools/microscopyManager';
import { ContextMenu } from '@ohif/ui';

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}) => {
  const {
    viewportGridService,
    toolbarService,
    uiDialogService,
    cornerstoneViewportService,
    customizationService,
    measurementService,
  } = servicesManager.services;

  const contextMenuController = new ContextMenu.Controller(
    servicesManager,
    commandsManager
  );

  function _showViewerContextMenu(viewerElement, options) {
    let defaultPointsPosition = [];
    if (options.nearbyToolData) {
      defaultPointsPosition = commandsManager.runCommand(
        'getToolDataActiveCanvasPoints',
        { toolData: options.nearbyToolData }
      );
    }

    contextMenuController.showContextMenu(
      options,
      viewerElement,
      defaultPointsPosition
    );
  }

  const actions = {
    /** Show the specified context menu */
    showViewerContextMenu: (providedOptions) => {
      // const viewerElement = _getActiveEnabledElement();
      // const options = { ...providedOptions };
      // const { event: evt } = options;
      // const { useSelectedAnnotation, nearbyToolData, menuName } = options;
      // if (menuName) {
      //   Object.assign(
      //     options,
      //     customizationService.getModeCustomization(
      //       menuName,
      //       defaultContextMenu
      //     )
      //   );
      // }
      // if (useSelectedAnnotation && !nearbyToolData) {
      //   const firstAnnotationSelected =
      //     getFirstAnnotationSelected(viewerElement);
      //   // filter by allowed selected tools from config property (if there is any)
      //   if (
      //     !options.allowedSelectedTools ||
      //     options.allowedSelectedTools.includes(
      //       firstAnnotationSelected?.metadata?.toolName
      //     )
      //   ) {
      //     options.nearbyToolData = firstAnnotationSelected;
      //   } else {
      //     return;
      //   }
      // }
      // // TODO - make the checkProps richer by including the study metadata and display set.
      // options.checkProps = {
      //   toolName: options.nearbyToolData?.metadata?.toolName,
      //   value: options.nearbyToolData,
      //   uid: options.nearbyToolData?.annotationUID,
      //   nearbyToolData: options.nearbyToolData,
      // };
      // _showViewerContextMenu(viewerElement, options);
    },

    /** Close any viewer context menus currently displayed */
    closeViewerContextMenu: () => {
      contextMenuController.closeViewerContextMenu();
    },

    getNearbyToolData({ nearbyToolData, element, canvasCoordinates }) {
      // return (
      //   nearbyToolData ??
      //   cstUtils.getAnnotationNearPoint(element, canvasCoordinates)
      // );
    },

    // Measurement tool commands:
    deleteMeasurement: ({ uid }) => {
      // if (uid) {
      //   // measurementServiceSource.remove(uid);
      // }
    },

    setLabel: ({ uid }) => {
      // const measurement = MeasurementService.getMeasurement(uid);
      // callInputDialog(
      //   uiDialogService,
      //   measurement,
      //   (label, actionId) => {
      //     if (actionId === 'cancel') {
      //       return;
      //     }
      //     const updatedMeasurement = Object.assign({}, measurement, {
      //       label,
      //     });
      //     MeasurementService.update(
      //       updatedMeasurement.uid,
      //       updatedMeasurement,
      //       true
      //     );
      //   },
      //   false
      // );
    },

    updateMeasurement: (props) => {
      // const { code, uid, measurementKey = 'finding' } = props;
      // const measurement = MeasurementService.getMeasurement(uid);
      // const updatedMeasurement = {
      //   ...measurement,
      //   [measurementKey]: code,
      //   label: code.text,
      // };
      // MeasurementService.update(
      //   updatedMeasurement.uid,
      //   updatedMeasurement,
      //   true
      // );
    },

    // Retrieve value commands
    setViewportActive: ({ viewportId }) => {
      // const viewportInfo =
      //   CornerstoneViewportService.getViewportInfo(viewportId);
      // if (!viewportInfo) {
      //   console.warn('No viewport found for viewportId:', viewportId);
      //   return;
      // }
      // const viewportIndex = viewportInfo.getViewportIndex();
      // viewportGridService.setActiveViewportIndex(viewportIndex);
    },
    arrowTextCallback: ({ callback, data }) => {
      // callInputDialog(uiDialogService, data, callback);
    },
    setToolActive: ({ toolName, toolGroupId = 'MICROSCOPY' }) => {
      if (
        [
          'line',
          'box',
          'circle',
          'point',
          'polygon',
          'freehandpolygon',
          'freehandline',
        ].indexOf(toolName) >= 0
      ) {
        // TODO: read from configuration
        const styleOptions = {
          stroke: {
            color: [0, 255, 0, 1],
            width: 1.2,
          },
        };
        let options = {
          geometryType: toolName,
          vertexEnabled: true,
          styleOptions,
        } as any;
        if ('line' === toolName) {
          options.minPoints = 2;
          options.maxPoints = 2;
        }
        else if('point' === toolName) {
          delete options.styleOptions;
          delete options.vertexEnabled;
        }

        microscopyManager.activateInteractions([['draw', options]]);
      } else if (toolName == 'dragPan') {
        microscopyManager.activateInteractions([['dragPan']]);
      }
    },
    rotateViewport: ({ rotation }) => {},
    flipViewportHorizontal: () => {},
    flipViewportVertical: () => {},
    invertViewport: ({ element }) => {},
    resetViewport: () => {},
    scaleViewport: ({ direction }) => {},
    scroll: ({ direction }) => {},
    incrementActiveViewport: () => {
      const { activeViewportIndex, viewports } = viewportGridService.getState();
      const nextViewportIndex = (activeViewportIndex + 1) % viewports.length;
      viewportGridService.setActiveViewportIndex(nextViewportIndex);
    },
    decrementActiveViewport: () => {
      const { activeViewportIndex, viewports } = viewportGridService.getState();
      const nextViewportIndex =
        (activeViewportIndex - 1 + viewports.length) % viewports.length;
      viewportGridService.setActiveViewportIndex(nextViewportIndex);
    },

    toggleOverlays: () => {
      // overlay
      const overlays = document.getElementsByClassName('microscopy-viewport-overlay');
      let onoff = false; // true if this will toggle on
      for (let i = 0; i < overlays.length; i++) {
        if (i === 0) onoff = overlays.item(0).classList.contains('hidden');
        overlays.item(i).classList.toggle('hidden');
      }

      // overview
      const { activeViewportIndex, viewports } = viewportGridService.getState();
      microscopyManager.toggleOverviewMap(activeViewportIndex);
    },
    toggleAnnotations: () => {
      microscopyManager.toggleROIsVisibility();
    }
  };

  const definitions = {
    showViewerContextMenu: {
      commandFn: actions.showViewerContextMenu,
      storeContexts: [] as any[],
      options: {},
    },
    closeViewerContextMenu: {
      commandFn: actions.closeViewerContextMenu,
      storeContexts: [] as any[],
      options: {},
    },
    getNearbyToolData: {
      commandFn: actions.getNearbyToolData,
      storeContexts: [] as any[],
      options: {},
    },

    // These should probably all be standard implementations
    // deleteMeasurement: {
    //   commandFn: actions.deleteMeasurement,
    //   storeContexts: [] as any[],
    //   options: {},
    // },
    // setLabel: {
    //   commandFn: actions.setLabel,
    //   storeContexts: [] as any[],
    //   options: {},
    // },
    // setFinding: {
    //   commandFn: actions.updateMeasurement,
    //   storeContexts: [] as any[],
    //   options: { measurementKey: 'finding' },
    // },
    // setSite: {
    //   commandFn: actions.updateMeasurement,
    //   storeContexts: [] as any[],
    //   options: { measurementKey: 'site' },
    // },

    setToolActive: {
      commandFn: actions.setToolActive,
      storeContexts: [] as any[],
      options: {},
    },
    rotateViewportCW: {
      commandFn: actions.rotateViewport,
      storeContexts: [] as any[],
      options: { rotation: 90 },
    },
    rotateViewportCCW: {
      commandFn: actions.rotateViewport,
      storeContexts: [] as any[],
      options: { rotation: -90 },
    },
    incrementActiveViewport: {
      commandFn: actions.incrementActiveViewport,
      storeContexts: [] as any[],
    },
    decrementActiveViewport: {
      commandFn: actions.decrementActiveViewport,
      storeContexts: [] as any[],
    },
    flipViewportHorizontal: {
      commandFn: actions.flipViewportHorizontal,
      storeContexts: [] as any[],
      options: {},
    },
    flipViewportVertical: {
      commandFn: actions.flipViewportVertical,
      storeContexts: [] as any[],
      options: {},
    },
    resetViewport: {
      commandFn: actions.resetViewport,
      storeContexts: [] as any[],
      options: {},
    },
    scaleUpViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: [] as any[],
      options: { direction: 1 },
    },
    scaleDownViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: [] as any[],
      options: { direction: -1 },
    },
    fitViewportToWindow: {
      commandFn: actions.scaleViewport,
      storeContexts: [] as any[],
      options: { direction: 0 },
    },
    arrowTextCallback: {
      commandFn: actions.arrowTextCallback,
      storeContexts: [] as any[],
      options: {},
    },
    setViewportActive: {
      commandFn: actions.setViewportActive,
      storeContexts: [] as any[],
      options: {},
    },
    toggleOverlays: {
      commandFn: actions.toggleOverlays,
      storeContexts: [] as any[],
      options: {},
    },
    toggleAnnotations: {
      commandFn: actions.toggleAnnotations,
      storeContexts: [] as any[],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'MICROSCOPY',
  };
};

export default commandsModule;
