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
      const { element, measurementData } = eventData;
      const { toolType } = measurementData;

      console.log(measurementData);

      const supportedToolTypes = ['Length', 'EllipticalRoi', 'RectangleRoi', 'ArrowAnnotate'];
      const validToolType = toolType => supportedToolTypes.includes(toolType);
      if (!validToolType(toolType)) {
        reject('Invalid tool type');
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
            if (handles[handle].x) points.push(handles[handle].x);
            if (handles[handle].y) points.push(handles[handle].y);
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

      resolve({
        id: measurementData._id,
        sopInstanceUID: sopInstanceUid,
        frameOfReferenceUID: frameOfReferenceUid,
        referenceSeriesUID: seriesInstanceUid,
        label: measurementData.text,
        description: measurementData.description,
        unit: measurementData.unit,
        area: measurementData.cachedStats && measurementData.cachedStats.area, // TODO: Add concept names instead (descriptor)
        type: TOOL_TYPE_TO_VALUE_TYPE[toolType],
        points: _getPointsFromHandles(measurementData.handles),
        source: 'CornerstoneTools', // TODO: multiple vendors
        sourceToolType: toolType,
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

      MeasurementService.subscribe(MEASUREMENT_ADDED, measurement =>
        console.log(
          '[subscribe::MEASUREMENT_ADDED] Measurement added',
          measurement
        )
      );

      MeasurementService.subscribe(MEASUREMENT_UPDATED, measurement =>
        console.log(
          '[subscribe::MEASUREMENT_UPDATED] Measurement updated',
          measurement
        )
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
