import OHIF from '@ohif/core';
import { SimpleDialog } from '@ohif/ui';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import initCornerstoneTools from './initCornerstoneTools.js';
import initWADOImageLoader from './initWADOImageLoader.js';
import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration }) {
  const { UIDialogService, MeasurementService } = servicesManager.services;

  const callInputDialog = (data, event, callback) => {
    if (UIDialogService) {
      let dialogId = UIDialogService.create({
        centralize: true,
        isDraggable: false,
        content: SimpleDialog.InputDialog,
        useLastPosition: false,
        showOverlay: true,
        contentProps: {
          title: 'Enter your annotation',
          label: 'New label',
          measurementData: data ? { description: data.text } : {},
          onClose: () => UIDialogService.dismiss({ id: dialogId }),
          onSubmit: value => {
            callback(value);
            UIDialogService.dismiss({ id: dialogId });
          },
        },
      });
    }
  };

  const { csToolsConfig } = configuration;
  const metadataProvider = OHIF.cornerstone.metadataProvider;

  cornerstone.metaData.addProvider(
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

  /* Measurement Service */
  _connectToolsToMeasurementService(MeasurementService);

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
      } else {
        parsedProps.configuration = { drawHandlesOnHover: true };
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
}

const _initMeasurementService = measurementService => {
  /* Initialization */
  const { toAnnotation, toMeasurement } = measurementServiceMappingsFactory(
    measurementService
  );
  const csToolsVer4MeasurementSource = measurementService.createSource(
    'CornerstoneTools',
    '4'
  );

  /* Matching Criterias */
  const matchingCriteria = {
    valueType: measurementService.VALUE_TYPES.POLYLINE,
    points: 2,
  };

  /* Mappings */
  measurementService.addMapping(
    csToolsVer4MeasurementSource,
    'Length',
    matchingCriteria,
    toAnnotation,
    toMeasurement
  );

  return csToolsVer4MeasurementSource;
};

const _connectToolsToMeasurementService = measurementService => {
  const csToolsVer4MeasurementSource = _initMeasurementService(
    measurementService
  );
  const { addOrUpdate, remove } = csToolsVer4MeasurementSource;
  const elementEnabledEvt = cornerstone.EVENTS.ELEMENT_ENABLED;

  /* Measurement Service Events */
  cornerstone.events.addEventListener(elementEnabledEvt, evt => {
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
        //
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

    const enabledElement = evt.detail.element;
    const completedEvt = csTools.EVENTS.MEASUREMENT_COMPLETED;
    const updatedEvt = csTools.EVENTS.MEASUREMENT_MODIFIED;
    const removedEvt = csTools.EVENTS.MEASUREMENT_REMOVED;

    enabledElement.addEventListener(completedEvt, addMeasurement);
    enabledElement.addEventListener(updatedEvt, updateMeasurement);
    enabledElement.addEventListener(removedEvt, removeMeasurement);
  });
};

// const {
//   MEASUREMENT_ADDED,
//   MEASUREMENT_UPDATED,
// } = measurementService.EVENTS;

// measurementService.subscribe(
//   MEASUREMENT_ADDED,
//   ({ source, measurement }) => {
//     if (![sourceId].includes(source.id)) {
//       const annotation = getAnnotation('Length', measurement.id);

//       console.log(
//         'Measurement Service [Cornerstone]: Measurement added',
//         measurement
//       );
//       console.log('Mapped annotation:', annotation);
//     }
//   }
// );

// measurementService.subscribe(
//   MEASUREMENT_UPDATED,
//   ({ source, measurement }) => {
//     if (![sourceId].includes(source.id)) {
//       const annotation = getAnnotation('Length', measurement.id);

//       console.log(
//         'Measurement Service [Cornerstone]: Measurement updated',
//         measurement
//       );
//       console.log('Mapped annotation:', annotation);
//     }
//   }
// );
