import React from 'react';
import OHIF from '@ohif/core';
import { Input, Dialog, ContextMenuMeasurements } from '@ohif/ui';
import cs from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import initCornerstoneTools from './initCornerstoneTools.js';
import initWADOImageLoader from './initWADOImageLoader.js';
import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';
import { setEnabledElement } from './state';

const { globalImageIdSpecificToolStateManager } = csTools;
const { restoreToolState, saveToolState } = globalImageIdSpecificToolStateManager;

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

const _refreshViewport = () => cs.getEnabledElements().forEach(({ element }) => cs.updateImage(element));

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, commandsManager, configuration }) {
  const {
    UIDialogService,
    MeasurementService,
    DisplaySetService,
  } = servicesManager.services;

  /* Measurement Service */
  const measurementServiceSource = _connectToolsToMeasurementService(MeasurementService, DisplaySetService);

  const onRightClick = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    const onGetMenuItems = (defaultMenuItems) => {
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

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      defaultPosition: _getDefaultPosition(event.detail),
      content: ContextMenuMeasurements,
      contentProps: {
        onGetMenuItems,
        eventData: event.detail,
        onDelete: (item) => {
          const { tool: measurementData, toolType } = item.value;
          measurementServiceSource.remove(measurementData.id);
          commandsManager.runCommand('removeToolState', {
            element: event.detail.element,
            toolType,
            tool: measurementData
          });
        },
        onClose: () => UIDialogService.dismiss({ id: 'context-menu' }),
        onSetLabel: item => {
          const { tool: measurementData } = item.value;
          callInputDialog({ text: measurementData.text }, event.detail, (text) => {
            measurementData.text = text;
          });
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
      contentProps: {
        isTouchEvent: true,
      },
    });
  };

  const onTouchStart = () => resetLabellingAndContextMenu();
  const onMouseClick = () => resetLabellingAndContextMenu();

  const resetLabellingAndContextMenu = () => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.dismiss({ id: 'labelling' });
  };

  /*
   * Because click gives us the native "mouse up", buttons will always be `0`
   * Need to fallback to event.which;
   *
   */
  const handleClick = cornerstoneMouseClickEvent => {
    const mouseUpEvent = cornerstoneMouseClickEvent.detail.event;
    const isRightClick = mouseUpEvent.which === 3;
    const clickMethodHandler = isRightClick ? onRightClick : onMouseClick;
    clickMethodHandler(cornerstoneMouseClickEvent);
  };

  function elementEnabledHandler(evt) {
    const element = evt.detail.element;
    element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.addEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.addEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;
    element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
  }

  const callInputDialog = (data, event, callback) => {
    const { element, currentPoints } = event;
    const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
      element,
      canvasCoordinates: currentPoints.canvas,
      availableToolTypes: TOOL_TYPES_WITH_CONTEXT_MENU
    });

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          callback(value.label);
          if (nearbyToolData.tool.id) {
            const measurement = MeasurementService.getMeasurement(nearbyToolData.tool.id);
            MeasurementService.update(nearbyToolData.tool.id, { ...measurement, ...value });
          }
        }
      }
      UIDialogService.dismiss({ id: 'enter-annotation' });
    };

    if (UIDialogService) {
      UIDialogService.create({
        id: 'enter-annotation',
        centralize: true,
        isDraggable: false,
        content: Dialog,
        useLastPosition: false,
        showOverlay: true,
        contentProps: {
          title: 'Enter your annotation',
          value: { label: data ? data.text : '' },
          noCloseButton: true,
          onClose: () => UIDialogService.dismiss({ id: 'enter-annotation' }),
          actions: [
            { id: 'cancel', text: 'Cancel', type: 'secondary' },
            { id: 'save', text: 'Save', type: 'primary' },
          ],
          onSubmit: ({ action, value }) => onSubmitHandler({ action, value }),
          body: ({ value, setValue }) => {
            const onChangeHandler = event => {
              event.persist();
              setValue(value => ({ ...value, label: event.target.value }));
            };

            const onKeyPressHandler = event => {
              event.persist();
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

  cs.metaData.addProvider(
    metadataProvider.get.bind(metadataProvider),
    9999
  );

  // ~~
  const defaultCsToolsConfig = csToolsConfig || {
    globalToolSyncEnabled: true,
    showSVGCursors: true,
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
      csTools.ProbeTool,
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
          callInputDialog(null, eventDetails, callback),
        changeTextCallback: (data, eventDetails, callback) =>
          callInputDialog(data, eventDetails, callback),
      },
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
    const toolName = tool.name.replace('Tool', '');
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
  cs.events.addEventListener(cs.EVENTS.ELEMENT_DISABLED, elementDisabledHandler);
}

const _initMeasurementService = (MeasurementService, DisplaySetService) => {
  /* Initialization */
  const mappings = measurementServiceMappingsFactory(MeasurementService, DisplaySetService);
  const {
    Length,
    Bidirectional,
    EllipticalRoi,
    ArrowAnnotate,
  } = mappings;
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

  return {
    source: csToolsVer4MeasurementSource,
    mappings
  };
};

const _connectToolsToMeasurementService = (
  MeasurementService,
  DisplaySetService
) => {
  const { source: csToolsVer4MeasurementSource, mappings } = _initMeasurementService(
    MeasurementService,
    DisplaySetService
  );
  _connectMeasurementServiceToTools(
    MeasurementService,
    csToolsVer4MeasurementSource,
    mappings
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

    const { MEASUREMENTS_CLEARED } = MeasurementService.EVENTS;
    MeasurementService.subscribe(MEASUREMENTS_CLEARED, () => restoreToolState({}));

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

const _connectMeasurementServiceToTools = (MeasurementService, measurementSource) => {
  const { MEASUREMENTS_CLEARED, MEASUREMENT_UPDATED } = MeasurementService.EVENTS;
  const sourceId = measurementSource.id;

  MeasurementService.subscribe(MEASUREMENTS_CLEARED, () => {
    restoreToolState({});
    _refreshViewport();
  });

  MeasurementService.subscribe(MEASUREMENT_UPDATED,
    ({ source, measurement }) => {
      if ([sourceId].includes(source.id)) {

        const toolState = saveToolState();
        Object.keys(toolState).forEach(imageId => {
          Object.keys(toolState[imageId]).forEach(toolType => {
            toolState[imageId][toolType].data.forEach((toolData, toolIndex) => {
              if (toolData.id === measurement.id) {
                /* Update the fields as we tune the arrow annotation mapping. */
                const updatedAnnotation = source.getAnnotation(toolType, measurement.id);
                if (updatedAnnotation) {
                  const { measurementData } = updatedAnnotation;
                  toolState[imageId][toolType].data[toolIndex].text = measurementData.text;
                }
              }
            });
          });
        });
        restoreToolState(toolState);
        _refreshViewport();
      }
    }
  );
};

const _getDefaultPosition = event => ({
  x: (event && event.currentPoints.client.x) || 0,
  y: (event && event.currentPoints.client.y) || 0,
});