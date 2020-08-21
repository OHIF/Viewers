import React from 'react';
import OHIF from '@ohif/core';
import { Input, Dialog, ContextMenuMeasurements } from '@ohif/ui';
import cs from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import initCornerstoneTools from './initCornerstoneTools.js';
import './initWADOImageLoader.js';
import getCornerstoneMeasurementById from './utils/getCornerstoneMeasurementById';
import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';
import { setEnabledElement } from './state';

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
];

const _refreshViewports = () =>
  cs.getEnabledElements().forEach(({ element }) => cs.updateImage(element));

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
  } = servicesManager.services;

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
          measurementServiceSource.remove(measurementData.id);
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

  function elementEnabledHandler(evt) {
    const element = evt.detail.element;
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

  /**
   *
   * @param {*} data
   * @param {*} event
   * @param {*} callback
   * @param {*} isArrowAnnotateInputDialog
   */
  const callInputDialog = (
    data,
    callback,
    isArrowAnnotateInputDialog = true
  ) => {
    const dialogId = 'enter-annotation';
    const label = data
      ? isArrowAnnotateInputDialog
        ? data.text
        : data.label
      : '';

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save':
          callback(value.label, action.id);
          break;
        case 'cancel':
          callback('', action.id);
          break;
      }
      UIDialogService.dismiss({ id: dialogId });
    };

    if (UIDialogService) {
      UIDialogService.create({
        id: dialogId,
        centralize: true,
        isDraggable: false,
        showOverlay: true,
        content: Dialog,
        contentProps: {
          title: 'Enter your annotation',
          value: { label },
          noCloseButton: true,
          onClose: () => UIDialogService.dismiss({ id: dialogId }),
          actions: [
            { id: 'cancel', text: 'Cancel', type: 'secondary' },
            { id: 'save', text: 'Save', type: 'primary' },
          ],
          onSubmit: onSubmitHandler,
          body: ({ value, setValue }) => {
            const onChangeHandler = event => {
              event.persist();
              setValue(value => ({ ...value, label: event.target.value }));
            };

            const onKeyPressHandler = event => {
              if (event.key === 'Enter') {
                onSubmitHandler({ value, action: { id: 'save' } });
              }
            };

            return (
              <div className="p-4 bg-primary-dark">
                <Input
                  autoFocus
                  className="mt-2 bg-black border-primary-main"
                  type="text"
                  containerClassName="mr-2"
                  value={value.label}
                  onChange={onChangeHandler}
                  onKeyPress={onKeyPressHandler}
                />
              </div>
            );
          },
        },
      });
    }
  };

  const { csToolsConfig } = configuration;
  const metadataProvider = OHIF.cornerstone.metadataProvider;

  cs.metaData.addProvider(metadataProvider.get.bind(metadataProvider), 9999);

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
  const handleOhifCornerstoneEnabledElementEvent = function (evt) {
    const { viewportIndex, enabledElement } = evt.detail;

    setEnabledElement(viewportIndex, enabledElement);
  };

  document.addEventListener(
    'ohif-cornerstone-enabled-element-event',
    handleOhifCornerstoneEnabledElementEvent
  );

  const toolsGroupedByType = {
    touch: [csTools.PanMultiTouchTool, csTools.ZoomTouchPinchTool],
    annotations: [
      csTools.ArrowAnnotateTool,
      csTools.BidirectionalTool,
      csTools.LengthTool,
      csTools.AngleTool,
      csTools.FreehandRoiTool,
      csTools.EllipticalRoiTool,
      csTools.DragProbeTool,
      csTools.RectangleRoiTool,
    ],
    other: [
      csTools.PanTool,
      csTools.ZoomTool,
      csTools.WwwcTool,
      csTools.WwwcRegionTool,
      csTools.MagnifyTool,
      csTools.StackScrollTool,
      csTools.StackScrollMouseWheelTool,
      csTools.OverlayTool,
    ],
  };

  let tools = [];
  Object.keys(toolsGroupedByType).forEach(toolsGroup =>
    tools.push(...toolsGroupedByType[toolsGroup])
  );

  /* Add extension tools configuration here. */
  const internalToolsConfig = {
    ArrowAnnotate: {
      configuration: {
        getTextCallback: (callback, eventDetails) =>
          callInputDialog(null, callback),
        changeTextCallback: (data, eventDetails, callback) =>
          callInputDialog(data, callback),
        allowEmptyLabel: true,
      },
    },
    DragProbe: {
      defaultStrategy: 'minimal',
    },
  };

  /* Abstract tools configuration using extension configuration. */
  const parseToolProps = (props, tool) => {
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
  };

  /* Add tools with its custom props through extension configuration. */
  tools.forEach(tool => {
    const toolName = new tool().name;
    const externalToolsConfig = configuration.tools || {};
    const externalToolProps = externalToolsConfig[toolName] || {};
    const internalToolProps = internalToolsConfig[toolName] || {};
    const props = merge(
      internalToolProps,
      parseToolProps(externalToolProps, tool)
    );
    csTools.addTool(tool, props);
  });

  // TODO -> We need a better way to do this with maybe global tool state setting all tools passive.
  const BaseAnnotationTool = csTools.importInternal('base/BaseAnnotationTool');
  tools.forEach(tool => {
    if (tool.prototype instanceof BaseAnnotationTool) {
      // BaseAnnotationTool would likely come from csTools lib exports
      const toolName = new tool().name;
      csTools.setToolPassive(toolName); // there may be a better place to determine name; may not be on uninstantiated class
    }
  });

  csTools.setToolActive('Pan', { mouseButtonMask: 4 });
  csTools.setToolActive('Zoom', { mouseButtonMask: 2 });
  csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  csTools.setToolActive('StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  csTools.setToolActive('PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  csTools.setToolActive('ZoomTouchPinch', {});
  csTools.setToolEnabled('Overlay', {});

  cs.events.addEventListener(cs.EVENTS.ELEMENT_ENABLED, elementEnabledHandler);
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
  measurementSource
) => {
  const { MEASUREMENT_REMOVED } = MeasurementService.EVENTS;
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
