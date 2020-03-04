import OHIF from '@ohif/core';
import { SimpleDialog } from '@ohif/ui';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import queryString from 'query-string';
import initCornerstoneTools from './initCornerstoneTools.js';
import { getEnabledElement } from './state';
import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

const draw = csTools.importInternal('drawing/draw');
const drawLine = csTools.importInternal('drawing/drawLine');
const convertToVector3 = csTools.importInternal('util/convertToVector3');
const planeIntersection = csTools.importInternal('util/planePlaneIntersection');
const projectPatientPointToImagePlane = csTools.importInternal(
  'util/projectPatientPointToImagePlane'
);
const getNewContext = csTools.importInternal('drawing/getNewContext');

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
      csTools.OverlayTool,
    ],
  };

  let tools = [];
  Object.keys(toolsGroupedByType).forEach(toolsGroup =>
    tools.push(...toolsGroupedByType[toolsGroup])
  );

  /* Measurement Service */
  _connectToolsToMeasurementService(MeasurementService);

  _enableReferenceLines();

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
  const {
    id: sourceId,
    addOrUpdate,
    getAnnotation,
  } = csToolsVer4MeasurementSource;

  /* Measurement Service Events */
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    event => {
      const {
        MEASUREMENT_ADDED,
        MEASUREMENT_UPDATED,
      } = measurementService.EVENTS;

      measurementService.subscribe(
        MEASUREMENT_ADDED,
        ({ source, measurement }) => {
          if (![sourceId].includes(source.id)) {
            const annotation = getAnnotation('Length', measurement.id);

            console.log(
              'Measurement Service [Cornerstone]: Measurement added',
              measurement
            );
            console.log('Mapped annotation:', annotation);
          }
        }
      );

      measurementService.subscribe(
        MEASUREMENT_UPDATED,
        ({ source, measurement }) => {
          if (![sourceId].includes(source.id)) {
            const annotation = getAnnotation('Length', measurement.id);

            console.log(
              'Measurement Service [Cornerstone]: Measurement updated',
              measurement
            );
            console.log('Mapped annotation:', annotation);
          }
        }
      );

      const addOrUpdateMeasurement = csToolsAnnotation => {
        try {
          const { toolName, toolType, measurementData } = csToolsAnnotation;
          const csTool = toolName || measurementData.toolType || toolType;
          csToolsAnnotation.id = measurementData._measurementServiceId;
          const measurementServiceId = addOrUpdate(csTool, csToolsAnnotation);

          if (!measurementData._measurementServiceId) {
            addMeasurementServiceId(measurementServiceId, csToolsAnnotation);
          }
        } catch (error) {
          console.warn('Failed to add or update measurement:', error);
        }
      };

      const addMeasurementServiceId = (id, csToolsAnnotation) => {
        const { measurementData } = csToolsAnnotation;
        Object.assign(measurementData, { _measurementServiceId: id });
      };

      [
        csTools.EVENTS.MEASUREMENT_ADDED,
        csTools.EVENTS.MEASUREMENT_MODIFIED,
      ].forEach(csToolsEvtName => {
        event.detail.element.addEventListener(
          csToolsEvtName,
          ({ detail: csToolsAnnotation }) => {
            console.log(`Cornerstone Element Event: ${csToolsEvtName}`);
            addOrUpdateMeasurement(csToolsAnnotation);
          }
        );
      });
    }
  );
};

const _enableReferenceLines = () => {
  const waitForImageRendered = enabledElement =>
    new Promise(resolve => {
      const onImageRenderedCallback = () => {
        enabledElement.removeEventListener(
          cornerstone.EVENTS.IMAGE_RENDERED,
          onImageRenderedCallback
        );
        resolve();
      };
      enabledElement.addEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        onImageRenderedCallback
      );
    });

  const renderReferenceLines = ({ detail: { enabledElement } }) => {
    const { activeViewportIndex } = window.store.getState().viewports;

    const currentEnabledElement = getEnabledElement(activeViewportIndex);
    if (currentEnabledElement !== enabledElement.element) return;

    const targetImage = enabledElement.image;
    cornerstone
      .getEnabledElements()
      .filter(e => e.uuid !== enabledElement.uuid)
      .forEach(async referenceElement => {
        if (!referenceElement.image)
          await waitForImageRendered(referenceElement.element);

        const referenceImage = referenceElement.image;

        if (!referenceImage || !targetImage) {
          console.error('Could not render reference lines, images not defined');
          return;
        }

        const targetImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          targetImage.imageId
        );
        const referenceImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          referenceImage.imageId
        );
        // Make sure the target and reference actually have image plane metadata
        if (
          !targetImagePlane ||
          !referenceImagePlane ||
          !targetImagePlane.rowCosines ||
          !targetImagePlane.columnCosines ||
          !targetImagePlane.imagePositionPatient ||
          !referenceImagePlane.rowCosines ||
          !referenceImagePlane.columnCosines ||
          !referenceImagePlane.imagePositionPatient
        ) {
          console.error(
            'Could not render reference lines, image plane modules not defined'
          );
          return;
        }

        if (
          targetImagePlane.frameOfReferenceUID !==
          referenceImagePlane.frameOfReferenceUID
        ) {
          return;
        }

        targetImagePlane.rowCosines = convertToVector3(
          targetImagePlane.rowCosines
        );
        targetImagePlane.columnCosines = convertToVector3(
          targetImagePlane.columnCosines
        );
        targetImagePlane.imagePositionPatient = convertToVector3(
          targetImagePlane.imagePositionPatient
        );
        referenceImagePlane.rowCosines = convertToVector3(
          referenceImagePlane.rowCosines
        );
        referenceImagePlane.columnCosines = convertToVector3(
          referenceImagePlane.columnCosines
        );
        referenceImagePlane.imagePositionPatient = convertToVector3(
          referenceImagePlane.imagePositionPatient
        );
        // The image plane normals must be > 30 degrees apart
        const targetNormal = targetImagePlane.rowCosines
          .clone()
          .cross(targetImagePlane.columnCosines);
        const referenceNormal = referenceImagePlane.rowCosines
          .clone()
          .cross(referenceImagePlane.columnCosines);
        let angleInRadians = targetNormal.angleTo(referenceNormal);
        angleInRadians = Math.abs(angleInRadians);
        if (angleInRadians < 0.5) {
          console.error(
            'Could not render reference lines, angle in radians does not match the expected value'
          );
          return;
        }

        const points = planeIntersection(targetImagePlane, referenceImagePlane);

        if (!points) {
          console.error('Could not render reference lines, points not defined');
          return;
        }

        const referenceLine = {
          start: projectPatientPointToImagePlane(
            points.start,
            referenceImagePlane
          ),
          end: projectPatientPointToImagePlane(points.end, referenceImagePlane),
        };

        if (!referenceLine) {
          console.error(
            'Could not render reference lines, no reference line to render'
          );
          return;
        }

        const onReferenceElementImageRendered = () => {
          const context = getNewContext(referenceElement.canvas);
          context.setTransform(1, 0, 0, 1, 0, 0);
          draw(context, newContext => {
            drawLine(
              newContext,
              referenceElement.element,
              referenceLine.start,
              referenceLine.end,
              { color: 'greenyellow' }
            );
          });

          referenceElement.element.removeEventListener(
            cornerstone.EVENTS.IMAGE_RENDERED,
            onReferenceElementImageRendered
          );
        };

        referenceElement.element.addEventListener(
          cornerstone.EVENTS.IMAGE_RENDERED,
          onReferenceElementImageRendered
        );
        cornerstone.updateImage(referenceElement.element);
      });
  };

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    event => {
      if (event.detail && event.detail.element) {
        event.detail.element.removeEventListener(
          cornerstone.EVENTS.IMAGE_RENDERED,
          renderReferenceLines
        );
      }
    }
  );

  const bindEnabledElementsEventListeners = enabledElements => {
    enabledElements.forEach(enabledElement => {
      enabledElement.addEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        renderReferenceLines
      );
    });
  };

  const unbindEnabledElementsEventListeners = enabledElements => {
    enabledElements.forEach(enabledElement => {
      enabledElement.removeEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        renderReferenceLines
      );
    });
  };

  let previousLayout;
  window.store.subscribe(() => {
    const { numColumns, numRows } = window.store.getState().viewports;
    const viewportCount = numRows * numColumns;

    if (viewportCount > 1) {
      if (
        !previousLayout ||
        (previousLayout &&
          (previousLayout.numColumns !== numColumns ||
            previousLayout.numRows !== numRows))
      ) {
        previousLayout = { numColumns, numRows };

        const enabledElements = [...csTools.store.state.enabledElements];

        // We have all the elements
        if (enabledElements.length === viewportCount) {
          bindEnabledElementsEventListeners(enabledElements);
        } else {
          cornerstone.events.addEventListener(
            cornerstone.EVENTS.ELEMENT_ENABLED,
            ({ detail: { element } }) => {
              enabledElements.push(element);

              if (enabledElements.length === viewportCount) {
                bindEnabledElementsEventListeners(enabledElements);
              }
            }
          );
        }
      }
    } else {
      if (previousLayout !== undefined) {
        previousLayout = undefined;
        unbindEnabledElementsEventListeners(
          csTools.store.state.enabledElements
        );
      }
    }
  });
};
