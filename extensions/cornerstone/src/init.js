import OHIF from '@ohif/core';
import { ContextMenuMeasurements } from '@ohif/ui';
import cs from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import getTools, { toolsGroupedByType } from './utils/getTools.js';
import initCornerstoneTools from './initCornerstoneTools.js';
import initWADOImageLoader from './initWADOImageLoader.js';
import getCornerstoneMeasurementById from './utils/getCornerstoneMeasurementById';
import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';
import { setEnabledElement } from './state';
import callInputDialog from './callInputDialog.js';

// TODO -> Global "context menu open state", or lots of expensive searches on drag?

let CONTEXT_MENU_OPEN = false;
const { globalImageIdSpecificToolStateManager } = csTools;

const TOOL_TYPES_WITH_CONTEXT_MENU = [
  'Angle',
  'ArrowAnnotate',
  'Bidirectional',
  'Length',
  'FreehandMouse',
  'EllipticalRoi',
  'CircleRoi',
  'RectangleRoi',
  // SR Viewport...
  'SRLength',
  'SRBidirectional',
  'SRArrowAnnotate',
  'SREllipticalRoi',
];

const _refreshViewports = () =>
  cs.getEnabledElements().forEach(({ element }) => cs.updateImage(element));

/* Add extension tools configuration here. */
const _createInternalToolsConfig = UIDialogService => {
  return {
    ArrowAnnotate: {
      configuration: {
        getTextCallback: (callback, eventDetails) =>
          callInputDialog(UIDialogService, null, callback),
        changeTextCallback: (data, eventDetails, callback) =>
          callInputDialog(UIDialogService, data, callback),
        allowEmptyLabel: true,
      },
    },
    DragProbe: {
      defaultStrategy: 'minimal',
    },
  };
};

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration,
}) {
  const {
    UIDialogService,
    MeasurementService,
    DisplaySetService,
    ToolBarService,
    UserAuthenticationService,
  } = servicesManager.services;
  const tools = getTools();

  console.log(servicesManager.services);

  /* Measurement Service */
  const measurementServiceSource = _connectToolsToMeasurementService(
    MeasurementService,
    DisplaySetService
  );

  const onRightClick = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    const onGetMenuItems = defaultMenuItems => {
      const { element, currentPoints } = event.detail;
      const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
        element,
        canvasCoordinates: currentPoints.canvas,
        availableToolTypes: TOOL_TYPES_WITH_CONTEXT_MENU,
      });

      let menuItems = [];
      if (nearbyToolData) {
        defaultMenuItems.forEach(item => {
          item.value = nearbyToolData;
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
          const { tool: measurementData, toolType } = item.value;

          // Sync'd w/ Measurement Service
          if (measurementData.id) {
            measurementServiceSource.remove(measurementData.id);
          }
          // Only in cstools
          else {
            const toolState =
              csTools.globalImageIdSpecificToolStateManager.toolState;

            Object.keys(toolState).forEach(imageId => {
              Object.keys(toolState[imageId]).forEach(imageToolType => {
                const numMeasurements =
                  toolState[imageId][imageToolType].data.length;

                for (let i = 0; i < numMeasurements; i++) {
                  const toolData = toolState[imageId][imageToolType].data[i];
                  if (measurementData.uuid === toolData.uuid) {
                    // Clear and nuke matching measurement
                    toolState[imageId][imageToolType].data[i] = null;
                    delete toolState[imageId][imageToolType].data[i];
                    toolState[imageId][imageToolType].data.splice(i, 1);

                    // Delete "data" if we deleted last measurement in array
                    // if (toolState[imageId][imageToolType].data.length === 0) {
                    //   delete toolState[imageId][imageToolType].data;
                    // }
                  }
                }
              });
            });
            console.log(csTools.store.state);
          }
          _refreshViewports();
          CONTEXT_MENU_OPEN = false;
        },
        onClose: () => {
          CONTEXT_MENU_OPEN = false;
          UIDialogService.dismiss({ id: 'context-menu' });
        },
        onSetLabel: item => {
          const { tool: measurementData } = item.value;

          const measurement = MeasurementService.getMeasurement(
            measurementData.id
          );

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
                updatedMeasurement.id,
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

  const onTouchPress = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.create({
      eventData: event.detail,
      content: ContextMenuMeasurements,
      contentProps: { isTouchEvent: true },
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

  const cancelContextMenuIfOpen = evt => {
    if (CONTEXT_MENU_OPEN) {
      resetContextMenu();
    }
  };

  // TODO: This is the handler for ALL ENABLED ELEMENT EVENTS
  // ... Activation logic should take place per element, not for all (diff behavior per ext)
  function elementEnabledHandler(tools, evt) {
    const element = evt.detail.element;

    _addConfiguredToolsForElement(
      UIDialogService,
      element,
      tools,
      configuration
    );

    element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.addEventListener(
      csTools.EVENTS.MOUSE_CLICK,
      contextMenuHandleClick
    );
    element.addEventListener(cs.EVENTS.NEW_IMAGE, cancelContextMenuIfOpen);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;
    element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.removeEventListener(
      csTools.EVENTS.MOUSE_CLICK,
      contextMenuHandleClick
    );
    element.removeEventListener(cs.EVENTS.NEW_IMAGE, cancelContextMenuIfOpen);
  }

  const { csToolsConfig } = configuration;
  const metadataProvider = OHIF.classes.MetadataProvider;

  cs.metaData.addProvider(metadataProvider.get.bind(metadataProvider), 9999);

  initWADOImageLoader(UserAuthenticationService);

  // ~~
  const defaultCsToolsConfig = csToolsConfig || {
    globalToolSyncEnabled: false, // hold on to your pants!
    showSVGCursors: false,
    autoResizeViewports: false,
  };

  initCornerstoneTools(defaultCsToolsConfig);
  // TODO: Extensions are still registered at time of registration globally
  // These should be registered as a part of mode route spin up,
  // and they need to self-clean on mode route destroy
  // THIS
  // is a way for extensions that "depend" on this extension to notify it of
  // new cornerstone enabled elements so it's commands continue to work.
  const handleOhifCornerstoneEnabledElementEvent = function(evt) {
    const { context, viewportIndex, enabledElement } = evt.detail;

    setEnabledElement(viewportIndex, enabledElement, context);
  };

  document.addEventListener(
    'ohif-cornerstone-enabled-element-event',
    handleOhifCornerstoneEnabledElementEvent
  );

  cs.events.addEventListener(
    cs.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null, tools)
  );
  cs.events.addEventListener(
    cs.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );
}

const _initMeasurementService = (MeasurementService, DisplaySetService) => {
  /* Initialization */
  const {
    Length,
    Bidirectional,
    EllipticalRoi,
    ArrowAnnotate,
  } = measurementServiceMappingsFactory(MeasurementService, DisplaySetService);
  const csToolsVer4MeasurementSource = MeasurementService.createSource(
    'CornerstoneTools',
    '4'
  );

  /* Mappings */
  MeasurementService.addMapping(
    csToolsVer4MeasurementSource,
    'Length',
    Length.matchingCriteria,
    Length.toAnnotation,
    Length.toMeasurement
  );

  MeasurementService.addMapping(
    csToolsVer4MeasurementSource,
    'Bidirectional',
    Bidirectional.matchingCriteria,
    Bidirectional.toAnnotation,
    Bidirectional.toMeasurement
  );

  MeasurementService.addMapping(
    csToolsVer4MeasurementSource,
    'EllipticalRoi',
    EllipticalRoi.matchingCriteria,
    EllipticalRoi.toAnnotation,
    EllipticalRoi.toMeasurement
  );

  MeasurementService.addMapping(
    csToolsVer4MeasurementSource,
    'ArrowAnnotate',
    ArrowAnnotate.matchingCriteria,
    ArrowAnnotate.toAnnotation,
    ArrowAnnotate.toMeasurement
  );

  return csToolsVer4MeasurementSource;
};

const _connectToolsToMeasurementService = (
  MeasurementService,
  DisplaySetService
) => {
  const csToolsVer4MeasurementSource = _initMeasurementService(
    MeasurementService,
    DisplaySetService
  );
  _connectMeasurementServiceToTools(
    MeasurementService,
    csToolsVer4MeasurementSource
  );
  const { addOrUpdate, remove } = csToolsVer4MeasurementSource;
  const elementEnabledEvt = cs.EVENTS.ELEMENT_ENABLED;

  /* Measurement Service Events */
  cs.events.addEventListener(elementEnabledEvt, evt => {
    // TODO: Debounced update of measurements that are modified
    function addMeasurement(csToolsEvent) {
      console.log('CSTOOLS::addOrUpdate', csToolsEvent, csToolsEvent.detail);

      try {
        const evtDetail = csToolsEvent.detail;
        const { toolName, toolType, measurementData } = evtDetail;
        const csToolName = toolName || measurementData.toolType || toolType;

        const measurementId = addOrUpdate(csToolName, evtDetail);

        if (measurementId) {
          measurementData.id = measurementId;
        }
      } catch (error) {
        console.warn('Failed to add measurement:', error);
      }
    }

    function updateMeasurement(csToolsEvent) {
      try {
        if (!csToolsEvent.detail.measurementData.id) {
          return;
        }

        const evtDetail = csToolsEvent.detail;
        const { toolName, toolType, measurementData } = evtDetail;
        const csToolName = toolName || measurementData.toolType || toolType;

        evtDetail.id = csToolsEvent.detail.measurementData.id;
        addOrUpdate(csToolName, evtDetail);
      } catch (error) {
        console.warn('Failed to update measurement:', error);
      }
    }

    /**
     * When csTools fires a removed event, remove the same measurement
     * from the measurement service
     *
     * @param {*} csToolsEvent
     */
    function removeMeasurement(csToolsEvent) {
      console.log('~~ removeEvt', csToolsEvent);
      try {
        if (csToolsEvent.detail.measurementData.id) {
          remove(csToolsEvent.detail.measurementData.id);
        }
      } catch (error) {
        console.warn('Failed to remove measurement:', error);
      }
    }

    const {
      MEASUREMENTS_CLEARED,
      MEASUREMENT_UPDATED,
    } = MeasurementService.EVENTS;

    MeasurementService.subscribe(MEASUREMENTS_CLEARED, () => {
      globalImageIdSpecificToolStateManager.restoreToolState({});
      _refreshViewports();
    });

    MeasurementService.subscribe(
      MEASUREMENT_UPDATED,
      ({ source, measurement, notYetUpdatedAtSource }) => {
        const { id, label } = measurement;

        if (
          source.name == 'CornerstoneTools' &&
          notYetUpdatedAtSource === false
        ) {
          // This event was fired by cornerstone telling the measurement service to sync. Already in sync.
          return;
        }
        const cornerstoneMeasurement = getCornerstoneMeasurementById(id);

        if (cornerstoneMeasurement) {
          cornerstoneMeasurement.label = label;
          if (cornerstoneMeasurement.hasOwnProperty('text')) {
            // Deal with the weird case of ArrowAnnotate.
            cornerstoneMeasurement.text = label;
          }

          _refreshViewports();
        }
      }
    );

    // on display sets added, check if there are any measurements in measurement service that need to be
    // put into cornerstone tools tooldata

    const enabledElement = evt.detail.element;
    const completedEvt = csTools.EVENTS.MEASUREMENT_COMPLETED;
    const updatedEvt = csTools.EVENTS.MEASUREMENT_MODIFIED;
    const removedEvt = csTools.EVENTS.MEASUREMENT_REMOVED;

    enabledElement.addEventListener(completedEvt, addMeasurement);
    enabledElement.addEventListener(updatedEvt, updateMeasurement);
    enabledElement.addEventListener(removedEvt, removeMeasurement);
  });

  return csToolsVer4MeasurementSource;
};

const _connectMeasurementServiceToTools = (
  MeasurementService,
  measurementSource,
  dataSource
) => {
  const {
    MEASUREMENT_REMOVED,
    RAW_MEASUREMENT_ADDED,
  } = MeasurementService.EVENTS;
  const sourceId = measurementSource.id;

  // TODO: This is an unsafe delete
  // Cornerstone-tools should probably expose a more generic "delete by id"
  // And have toolState managers expose a method to find any of their toolState by ID
  // --> csTools.deleteById --> internally checks all registered modules/managers?
  //
  // This implementation assumes a single globalImageIdSpecificToolStateManager
  // It iterates all toolState for all toolTypes, and deletes any with a matching id
  //
  // Could potentially use "source" from event to determine tool type and skip some
  // iterations?

  const {
    POLYLINE,
    ELLIPSE,
    POINT,
    BIDIRECTIONAL,
  } = MeasurementService.VALUE_TYPES;

  // TODO -> I get why this was attemped, but its not nearly flexible enough.
  // A single measurement may have an ellipse + a bidirectional measurement, for instances.
  // You can't define a bidirectional tool as a single type..
  // OHIF-230
  const TOOL_TYPE_TO_VALUE_TYPE = {
    Length: POLYLINE,
    EllipticalRoi: ELLIPSE,
    Bidirectional: BIDIRECTIONAL,
    ArrowAnnotate: POINT,
  };

  const VALUE_TYPE_TO_TOOL_TYPE = {
    [POLYLINE]: 'Length',
    [ELLIPSE]: 'EllipticalRoi',
    [BIDIRECTIONAL]: 'Bidirectional',
    [POINT]: 'ArrowAnnotate',
  };

  MeasurementService.subscribe(
    RAW_MEASUREMENT_ADDED,
    ({ source, measurement, data, dataSource }) => {
      const {
        referenceStudyUID: StudyInstanceUID,
        referenceSeriesUID: SeriesInstanceUID,
        SOPInstanceUID,
      } = measurement;

      let toolType;
      try {
        toolType = VALUE_TYPE_TO_TOOL_TYPE[measurement.type];
      } catch {
        throw Error('Cannot add tool to cornerstone tools');
      }

      let imageId;
      if (data.imageId) {
        // handle dicom json launch, since we cannot create image id from
        // instance UIDs, each tool should embed the instance metadata
        // TODO: handle multi instance case
        imageId = data.imageId;
      } else {
        // handle general case of dicom web
        const instance = {
          StudyInstanceUID,
          SeriesInstanceUID,
          SOPInstanceUID,
        };
        // TODO: handle multi frame
        imageId = dataSource.getImageIdsForInstance({ instance });
      }

      const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

      if (toolState[imageId] === undefined) {
        toolState[imageId] = {};
      }

      const imageIdToolState = toolState[imageId];

      // If we don't have tool state for this type of tool, add an empty object
      if (imageIdToolState[toolType] === undefined) {
        imageIdToolState[toolType] = {
          data: [],
        };
      }

      const toolData = imageIdToolState[toolType];

      toolData.data.push(data);
    }
  );

  MeasurementService.subscribe(
    MEASUREMENT_REMOVED,
    ({ source, measurement: removedMeasurementId }) => {
      // THIS POINTS TO ORIGINAL; Not a copy
      const imageIdSpecificToolState = globalImageIdSpecificToolStateManager.saveToolState();

      // ImageId -->
      Object.keys(imageIdSpecificToolState).forEach(imageId => {
        // ImageId --> Tool -->
        Object.keys(imageIdSpecificToolState[imageId]).forEach(toolName => {
          const toolState = imageIdSpecificToolState[imageId][toolName];

          let annotationIndex = toolState.data.length - 1;
          while (annotationIndex >= 0) {
            const annotation = toolState.data[annotationIndex];

            if (annotation.id === removedMeasurementId) {
              toolState.data.splice(annotationIndex, 1);
            }

            annotationIndex--;
          }
        });
      });
    }
  );
};

const _getDefaultPosition = event => ({
  x: (event && event.currentPoints.client.x) || 0,
  y: (event && event.currentPoints.client.y) || 0,
});

/**
 * @private
 */
function _addConfiguredToolsForElement(
  UIDialogService,
  element,
  tools,
  configuration
) {
  const internalToolsConfig = _createInternalToolsConfig(UIDialogService);
  /* Add tools with its custom props through extension configuration. */
  tools.forEach(tool => {
    const toolName = new tool().name;
    const externalToolsConfig = configuration.tools || {};
    const externalToolProps = externalToolsConfig[toolName] || {};
    const internalToolProps = internalToolsConfig[toolName] || {};
    const props = merge(
      internalToolProps,
      _parseToolProps(configuration, externalToolProps, tool)
    );
    csTools.addToolForElement(element, tool, props);
  });
}
/* Abstract tools configuration using extension configuration. */
function _parseToolProps(configuration, props, tool) {
  const { annotations } = toolsGroupedByType;
  // An alternative approach would be to remove the `drawHandlesOnHover` config
  // from the supported configuration properties in `cornerstone-tools`
  const toolsWithHideableHandles = annotations.filter(
    tool => !['RectangleRoiTool', 'EllipticalRoiTool'].includes(tool.name)
  );

  let parsedProps = { ...props };

  /**
   * drawHandles - Never/Always show handles
   * drawHandlesOnHover - Only show handles on handle hover (pointNearHandle)
   * hideHandlesIfMoving - Hides the handles whilst you are moving them, for better visibility.
   *
   * Does not apply to tools where handles aren't placed in predictable
   * locations.
   */
  if (
    configuration.hideHandles !== false &&
    toolsWithHideableHandles.includes(tool)
  ) {
    if (props.configuration) {
      parsedProps.configuration.drawHandlesOnHover = true;
      parsedProps.configuration.hideHandlesIfMoving = true;
    } else {
      parsedProps.configuration = {
        drawHandlesOnHover: true,
        hideHandlesIfMoving: true,
      };
    }
  }

  return parsedProps;
}
