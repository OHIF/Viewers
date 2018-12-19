const BaseAnnotationTool = cornerstoneTools.import('base/BaseAnnotationTool');
const moveNewHandle = cornerstoneTools.import('manipulators/moveNewHandle');
const drawArrow = cornerstoneTools.import('drawing/drawArrow');
const drawHandles = cornerstoneTools.import('drawing/drawHandles');
const drawTextBox = cornerstoneTools.import('drawing/drawTextBox');
const pointInsideBoundingBox = cornerstoneTools.import('util/pointInsideBoundingBox');


// Used to cancel tool placement
const keys = {
  ESC: 27
};

const getPosition = eventData => {
  const event = eventData.event;
  return {
      x: event.clientX,
      y: event.clientY
  };
};

// Define a callback to get your text annotation
// This could be used, e.g. to open a modal
function getMeasurementLocationCallback(measurementData, eventData) {
  if (OHIF.lesiontracker.removeMeasurementIfInvalid(measurementData, eventData)) {
      return;
  }

  delete measurementData.isCreating;

  OHIF.ui.showDialog('dialogNonTargetMeasurement', {
      position: getPosition(eventData),
      title: 'Select Lesion Location',
      element: eventData.element,
      measurementData
  });
}

function changeMeasurementLocationCallback(measurementData, eventData) {
  if (OHIF.lesiontracker.removeMeasurementIfInvalid(measurementData, eventData)) {
      return;
  }

  OHIF.ui.showDialog('dialogNonTargetMeasurement', {
      position: getPosition(eventData),
      title: 'Change Lesion Location',
      element: eventData.element,
      measurementData,
      edit: true
  });
}

export default class nonTargetTool extends BaseAnnotationTool {
  constructor(props) {
    const name = 'nonTarget';

    // const toolDefaultStates = Viewerbase.toolManager.getToolDefaultStates();
    const shadowConfig = {};
    const textBoxConfig = {};

    const configuration = Object.assign({}, shadowConfig, {
        getMeasurementLocationCallback,
        changeMeasurementLocationCallback,
        drawHandles: false,
        drawHandlesOnHover: true,
        arrowFirst: true,
        textBox: textBoxConfig
    });

    super({
      name,
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration
    });
  }

  createNewMeasurement = (event) => {
    const eventData = event.detail;
    const { image, currentPoints } = eventData;
    const { imageId } = image;

    // Get studyInstanceUid
    const study = cornerstone.metaData.get('study', imageId);
    const { studyInstanceUid, patientId } = study;

    // Get seriesInstanceUid
    const series = cornerstone.metaData.get('series', imageId);
    const { seriesInstanceUid } = series;

    // create the measurement data for this tool with the end handle activated
    const measurementData = {
        isCreating: true,
        visible: true,
        active: true,
        handles: {
            start: {
                x: currentPoints.image.x,
                y: currentPoints.image.y,
                allowedOutsideImage: true,
                highlight: true,
                active: false
            },
            end: {
                x: currentPoints.image.x,
                y: currentPoints.image.y,
                allowedOutsideImage: true,
                highlight: true,
                active: false
            },
            textBox: {
                x: currentPoints.image.x - 50,
                y: currentPoints.image.y - 50,
                active: false,
                movesIndependently: false,
                drawnIndependently: true,
                allowedOutsideImage: true,
                hasBoundingBox: true
            }
        },
        imageId: imageId,
        seriesInstanceUid: seriesInstanceUid,
        studyInstanceUid: studyInstanceUid,
        patientId: patientId,
        response: '',
        isTarget: false,
        toolType: 'nonTarget'
    };

    return measurementData;
  };

  pointNearTool = (element, data, coords) => {
    const lineSegment = {
        start: cornerstone.pixelToCanvas(element, data.handles.start),
        end: cornerstone.pixelToCanvas(element, data.handles.end)
    };
    const distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);

    if (pointInsideBoundingBox(data.handles.textBox, coords)) {
        return true;
    }

    return distanceToPoint < 25;
  }

  renderToolData = (event) => {
    const eventData = event.detail;
    const { element } = eventData;

    // if we have no toolData for this element, return immediately as there is nothing to do
    const toolData = cornerstoneTools.getToolState(element, this.name);
    if (!toolData) {
        return;
    }

    // we have tool data for this element - iterate over each one and draw it
    const context = eventData.canvasContext.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);

    let color;
    const lineWidth = cornerstoneTools.toolStyle.getToolWidth();
    const config = this.configuration;

    for (let i = 0; i < toolData.data.length; i++) {
        const data = toolData.data[i];
        if (data.visible === false) {
          continue;
        }

        context.save();

        // configurable shadow from CornerstoneTools
        if (config && config.shadow) {
            context.shadowColor = config.shadowColor || '#000000';
            context.shadowOffsetX = config.shadowOffsetX || 1;
            context.shadowOffsetY = config.shadowOffsetY || 1;
        }

        if (data.active) {
            color = cornerstoneTools.toolColors.getActiveColor();
        } else {
            color = cornerstoneTools.toolColors.getToolColor();
        }

        // Draw the arrow
        const handleStartCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        const handleEndCanvas = cornerstone.pixelToCanvas(element, data.handles.end);
        const canvasTextLocation = cornerstone.pixelToCanvas(element, data.handles.textBox);

        drawArrow(context, handleEndCanvas, handleStartCanvas, color, lineWidth);

        if (config.drawHandles) {
            drawHandles(context, eventData, data.handles, color);
        } else if (config.drawHandlesOnHover && data.handles.start.active) {
            drawHandles(context, eventData, [ data.handles.start ], color);
        } else if (config.drawHandlesOnHover && data.handles.end.active) {
            drawHandles(context, eventData, [ data.handles.end ], color);
        }

        // Draw the text
        if (data.measurementNumber) {
            const textLine = `Non-Target ${data.measurementNumber}`;
            const boundingBox = drawTextBox(context, textLine, canvasTextLocation.x, canvasTextLocation.y, color, config.textBox);
            data.handles.textBox.boundingBox = boundingBox;

            OHIF.cornerstone.repositionTextBox(eventData, data, config.textBox);

            // Draw linked line as dashed
            const link = {
                start: {},
                end: {}
            };

            const midpointCanvas = {
                x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
                y: (handleStartCanvas.y + handleEndCanvas.y) / 2,
            };

            const points = [ handleStartCanvas, handleEndCanvas, midpointCanvas ];

            link.end.x = canvasTextLocation.x;
            link.end.y = canvasTextLocation.y;

            link.start = cornerstoneMath.point.findClosestPoint(points, link.end);

            const boundingBoxPoints = [ {
                    // Top middle point of bounding box
                    x: boundingBox.left + boundingBox.width / 2,
                    y: boundingBox.top
                }, {
                    // Left middle point of bounding box
                    x: boundingBox.left,
                    y: boundingBox.top + boundingBox.height / 2
                }, {
                    // Bottom middle point of bounding box
                    x: boundingBox.left + boundingBox.width / 2,
                    y: boundingBox.top + boundingBox.height
                }, {
                    // Right middle point of bounding box
                    x: boundingBox.left + boundingBox.width,
                    y: boundingBox.top + boundingBox.height / 2
                },
            ];

            link.end = cornerstoneMath.point.findClosestPoint(boundingBoxPoints, link.start);
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.setLineDash([ 2, 3 ]);

            context.moveTo(link.start.x, link.start.y);
            context.lineTo(link.end.x, link.end.y);
            context.stroke();
        }

        context.restore();
    }
  };

  addNewMeasurement = (event) => {
    const eventData = event.detail;
    const { element } = eventData;
    const $element = $(element);

    doneCallback = () => {
        measurementData.active = true;
        cornerstone.updateImage(element);
    }

    const measurementData = this.createNewMeasurement(event);
    measurementData.viewport = cornerstone.getViewport(element);

    const tool = cornerstoneTools[this.name];
    const config = this.configuration;

    // associate this data with this imageId so we can render it and manipulate it
    cornerstoneTools.addToolState(element, this.name, measurementData);

    // Add a flag for using Esc to cancel tool placement
    let cancelled = false;
    const cancelAction = () => {
        cancelled = true;
        cornerstoneTools.removeToolState(element, this.name, measurementData);
    };

    // Add a flag for using Esc to cancel tool placement
    const keyDownHandler = event => {
        // If the Esc key was pressed, set the flag to true
        if (event.which === keys.ESC) {
            cancelAction();
        }

        // Don't propagate this keydown event so it can't interfere
        // with anything outside of this tool
        return false;
    };

    // Bind a one-time event listener for the Esc key
    $(element).one('keydown', keyDownHandler);

    // Bind a mousedown handler to cancel the measurement if it's zero-sized
    const mousedownHandler = () => {
        const { start, end } = measurementData.handles;
        if (!cornerstoneMath.point.distance(start, end)) {
            cancelAction();
        }
    };

    // Bind a one-time event listener for mouse down
    $element.one('mousedown', mousedownHandler);

    // Keep the current image and create a handler for new rendered images
    const currentImage = cornerstone.getImage(element);
    const currentViewport = cornerstone.getViewport(element);
    const imageRenderedHandler = () => {
        const newImage = cornerstone.getImage(element);

        // Check if the rendered image changed during measurement creation and delete it if so
        if (newImage.imageId !== currentImage.imageId) {
            cornerstone.displayImage(element, currentImage, currentViewport);
            cancelAction();
            cornerstone.displayImage(element, newImage, currentViewport);
        }
    };

    // Bind the event listener for image rendering
    element.addEventListener('cornerstoneimagerendered', imageRenderedHandler);

    // Bind the tool deactivation and enlargement handlers
    $element.one('ohif.viewer.viewport.toggleEnlargement', cancelAction);

    cornerstone.updateImage(element);

    moveNewHandle(
      eventData,
      this.name, 
      measurementData, 
      measurementData.handles.end, 
      function() {
        if (cancelled || cornerstoneTools.anyHandlesOutsideImage(eventData, measurementData.handles)) {
            // delete the measurement
            cornerstoneTools.removeToolState(eventData.element, this.name, measurementData);
        } else {
            config.getMeasurementLocationCallback(measurementData, eventData, doneCallback);
        }

        // Unbind the Esc keydown hook
        $element.off('keydown', keyDownHandler);

        // Unbind the mouse down hook
        $element.off('mousedown', mousedownHandler);

        // Unbind the event listener for image rendering
        element.removeEventListener('cornerstoneimagerendered', imageRenderedHandler);

        // Unbind the tool deactivation and enlargement handlers
        $element.off('ohif.viewer.viewport.toggleEnlargement', cancelAction);

        // Disable the default handlers and re-enable again
        element.addEventListener('cornerstonetoolsmousemove', tool.mouseMoveCallback);
        element.addEventListener('cornerstonetoolsmousedown', tool.mouseDownCallback);
        element.addEventListener('cornerstonetoolsmousedownactivate', tool.mouseDownActivateCallback);
        element.addEventListener('cornerstonetoolsmousedoubleclick', this.doubleClickCallback);

        cornerstone.updateImage(element);
    });
  }

  doubleClickCallback = (event) => {
    const eventData = event.detail;
    const { element, currentPoints } = eventData;
    let data;

    doneCallback = (data, deleteTool) => {
        if (deleteTool === true) {
            cornerstoneTools.removeToolState(element, this.name, data);
            cornerstone.updateImage(element);
            return;
        }

        data.active = false;
        cornerstone.updateImage(element);
    }

    if (event.data && 
        event.data.mouseButtonMask) {
        return false;
    }

    // Check if the element is enabled and stop here if not
    try {
        cornerstone.getEnabledElement(element);
    } catch (error) {
        return;
    }

    const config = this.configuration;
    const coords = currentPoints.canvas;
    const toolData = cornerstoneTools.getToolState(element, this.name);

    // now check to see if there is a handle we can move
    if (!toolData) {
        return;
    }

    for (let i = 0; i < toolData.data.length; i++) {
        data = toolData.data[i];
        if (this.pointNearTool(element, data, coords)) {
            data.active = true;
            cornerstone.updateImage(element);
            // Allow relabelling via a callback
            config.changeMeasurementLocationCallback(data, eventData, doneCallback);

            event.stopImmediatePropagation();
            return false;
        }
    }
  }
};
