import OHIF from '@ohif/core';
import { SimpleDialog } from '@ohif/ui';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import queryString from 'query-string';
import initCornerstoneTools from './initCornerstoneTools.js';

function fallbackMetaDataProvider(type, imageId) {
  if (!imageId.includes('wado?requestType=WADO')) {
    return;
  }

  // If you call for an WADO-URI imageId and get no
  // metadata, try reformatting to WADO-RS imageId
  const qs = queryString.parse(imageId);
  const wadoRoot = window.store.getState().servers.servers[0].wadoRoot;
  const wadoRsImageId = `wadors:${wadoRoot}/studies/${qs.studyUID}/series/${
    qs.seriesUID
    }/instances/${qs.objectUID}/frames/${qs.frame || 1}`;

  return cornerstone.metaData.get(type, wadoRsImageId);
}

// Add this fallback provider with a low priority so it is handled last
cornerstone.metaData.addProvider(fallbackMetaDataProvider, -1);

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
  const { StackManager } = OHIF.utils;
  const metadataProvider = new OHIF.cornerstone.MetadataProvider();

  // ~~ Set our MetadataProvider
  cornerstone.metaData.addProvider(
    metadataProvider.provider.bind(metadataProvider)
  );

  StackManager.setMetadataProvider(metadataProvider);

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
      csTools.EraserTool,
      csTools.BidirectionalTool,
      csTools.LengthTool,
      csTools.AngleTool,
      csTools.FreehandRoiTool,
      csTools.EllipticalRoiTool,
      csTools.DragProbeTool,
      csTools.RectangleRoiTool,
    ],
    segmentation: [csTools.BrushTool],
    other: [
      csTools.PanTool,
      csTools.ZoomTool,
      csTools.WwwcTool,
      csTools.WwwcRegionTool,
      csTools.MagnifyTool,
      csTools.StackScrollTool,
      csTools.StackScrollMouseWheelTool,
    ],
  };

  let tools = [];
  Object.keys(toolsGroupedByType).forEach(toolsGroup =>
    tools.push(...toolsGroupedByType[toolsGroup])
  );

  const mapAnnotationToMeasurementServiceFormat = eventData =>
    new Promise((resolve, reject) => {
      const { toolName, element, measurementData } = eventData;

      const supportedToolTypes = ['Length', 'EllipticalRoi', 'RectangleRoi', 'ArrowAnnotate'];
      const validToolType = toolName => supportedToolTypes.includes(toolName);

      if (!validToolType(toolName)) {
        return reject('Invalid tool type');
      }

      const enabledElement = cornerstone.getEnabledElement(element);
      const imageId = enabledElement.image.imageId;
      const sopInstance = cornerstone.metaData.get('instance', imageId);
      const sopInstanceUid = sopInstance.sopInstanceUid;
      const frameOfReferenceUid = sopInstance.frameOfReferenceUID;
      const series = cornerstone.metaData.get('series', imageId);
      const seriesInstanceUid = series.seriesInstanceUid;

      const _getPointsFromHandles = handles => {
        let points = [];
        Object.keys(handles).map(handle => {
          if (['start', 'end'].includes(handle)) {
            let point = {};
            if (handles[handle].x) point.x = handles[handle].x;
            if (handles[handle].y) point.y = handles[handle].y;
            points.push(point);
          }
        });
        return points;
      };

      const points = [];
      points.push(measurementData.handles);

      const TOOL_TYPE_TO_VALUE_TYPE = {
        Length: MeasurementService.constructor.VALUE_TYPES.POLYLINE, // TODO: Relocate static value types
        EllipticalRoi: MeasurementService.constructor.VALUE_TYPES.ELLIPSE,
        RectangleRoi: MeasurementService.constructor.VALUE_TYPES.POLYLINE,
        ArrowAnnotate: MeasurementService.constructor.VALUE_TYPES.POINT,
      };

      return resolve({
        id: measurementData._id,
        sopInstanceUID: sopInstanceUid,
        frameOfReferenceUID: frameOfReferenceUid,
        referenceSeriesUID: seriesInstanceUid,
        label: measurementData.text,
        description: measurementData.description,
        unit: measurementData.unit,
        area: measurementData.cachedStats && measurementData.cachedStats.area, // TODO: Add concept names instead (descriptor)
        type: TOOL_TYPE_TO_VALUE_TYPE[toolName],
        points: _getPointsFromHandles(measurementData.handles),
        source: 'CornerstoneTools', // TODO: multiple vendors
        sourceToolType: toolName,
      });
    });

  const mapMeasurementServiceFormatToAnnotation = ({
    source,
    sourceToolType,
    label,
    description,
    type,
    points,
    unit,
    sopInstanceUID,
    frameOfReferenceUID,
    referenceSeriesUID,
  }) =>
    new Promise((resolve, reject) => {
      if (!['CornerstoneTools'].includes(source)) {
        return reject('Invalid measurement');
      }

      let toolType = sourceToolType;

      if (!toolType) {
        switch (type) {
          case MeasurementService.constructor.VALUE_TYPES.POLYLINE:
            if (points.length === 2) toolType = 'Length';
            break;
          case MeasurementService.constructor.VALUE_TYPES.POINT:
            if (label) toolType = 'ArrowAnnotate';
            break;
          default:
            break;
        }
      }

      const _getHandlesFromPoints = points => {
        return points
          .map((p, i) => (i % 10 === 0 ? { start: p } : { end: p }))
          .reduce((obj, item) => Object.assign(obj, { ...item }), {});
      };

      return resolve({
        toolName: toolType,
        measurementData: {
          sopInstanceUid: sopInstanceUID,
          frameOfReferenceUid: frameOfReferenceUID,
          seriesInstanceUid: referenceSeriesUID,
          unit,
          label,
          description,
          handles: _getHandlesFromPoints(points),
        },
      });
    });

  /* Measurement Service Events */
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    event => {
      const {
        MEASUREMENT_ADDED,
        MEASUREMENT_UPDATED,
      } = MeasurementService.getEvents();

      MeasurementService.subscribe(
        MEASUREMENT_ADDED,
        measurement =>
          console.log(
            '[subscriber::MEASUREMENT_ADDED] Measurement added',
            measurement
          ),
        'cornerstone'
      );

      MeasurementService.subscribe(
        MEASUREMENT_UPDATED,
        async measurement => {
          console.log(
            '[subscriber::MEASUREMENT_UPDATED] Measurement updated',
            measurement
          );
          const mappedMeasurement = await mapMeasurementServiceFormatToAnnotation(measurement);
          console.log('Mapped annotation:', mappedMeasurement);
        },
        'cornerstone'
      );

      const addOrUpdateMeasurement = async eventData => {
        try {
          const { measurementData } = eventData;
          const mappedMeasurement = await mapAnnotationToMeasurementServiceFormat(
            eventData
          );
          const measurementServiceId = MeasurementService.addOrUpdate({
            ...mappedMeasurement,
            id: measurementData._measurementServiceId,
          }, 'cornerstone');
          if (!measurementData._measurementServiceId) {
            addMeasurementServiceId(measurementServiceId, eventData);
          }
        } catch (error) {
          console.warn('Failed to add or update measurement in measurement service:', error);
        }
      };

      const addMeasurementServiceId = (id, eventData) => {
        const { measurementData } = eventData;
        Object.assign(measurementData, { _measurementServiceId: id });
      };

      event.detail.element.addEventListener(
        csTools.EVENTS.MEASUREMENT_MODIFIED, event => {
          console.log(
            '[MEASUREMENT_MODIFIED] Updating measurement...',
            event.detail
          );
          addOrUpdateMeasurement(event.detail);
        }
      );

      event.detail.element.addEventListener(
        csTools.EVENTS.MEASUREMENT_ADDED, event => {
          console.log(
            '[MEASUREMENT_ADDED] Adding new measurement...',
            event.detail
          );
          addOrUpdateMeasurement(event.detail);
        }
      );
    }
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
}
