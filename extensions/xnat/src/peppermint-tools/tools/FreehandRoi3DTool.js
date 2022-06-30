import {
  metaData,
  updateImage,
  pixelToCanvas,
  getEnabledElement,
  getPixels,
} from 'cornerstone-core';
import { point } from 'cornerstone-math';
import {
  importInternal,
  FreehandRoiTool,
  getToolState,
  store,
  toolStyle,
  toolColors,
  EVENTS,
} from 'cornerstone-tools';

import TOOL_NAMES from '../toolNames';
import generateUID from '../utils/generateUID.js';
import interpolate from '../utils/freehandInterpolate/interpolate';
import getSeriesInstanceUidFromEnabledElement from '../../utils/getSeriesInstanceUidFromEnabledElement';

// Cornerstone 3rd party dev kit imports
const {
  insertOrDelete,
  freehandArea,
  calculateFreehandStatistics,
} = importInternal('util/freehandUtils');
const draw = importInternal('drawing/draw');
const drawJoinedLines = importInternal('drawing/drawJoinedLines');
const drawHandles = importInternal('drawing/drawHandles');
const drawLinkedTextBox = importInternal('drawing/drawLinkedTextBox');
const moveHandleNearImagePoint = importInternal(
  'manipulators/moveHandleNearImagePoint'
);
const getNewContext = importInternal('drawing/getNewContext');
const modules = store.modules;
const numbersWithCommas = importInternal('util/numbersWithCommas');
const pointInsideBoundingBox = importInternal('util/pointInsideBoundingBox');
const calculateSUV = importInternal('util/calculateSUV');

export default class FreehandRoi3DTool extends FreehandRoiTool {
  constructor(props = {}) {
    const defaultProps = {
      configuration: defaultFreehandConfiguration(),
      name: TOOL_NAMES.FREEHAND_ROI_3D_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    this.configuration.alwaysShowHandles = false;
    this._freehand3DStore = modules.freehand3D;

    this._onMeasurementRemoved = this._onMeasurementRemoved.bind(this);
    this._drawingMouseUpCallback = this._drawingMouseUpCallback.bind(this);
  }

  /**
   * Create the measurement data for this tool.
   * @override @public @method
   *
   * @param {object} eventData
   * @returns {object} measurementData
   */
  createNewMeasurement(eventData) {
    const freehand3DStore = this._freehand3DStore;
    const goodEventData =
      eventData && eventData.currentPoints && eventData.currentPoints.image;

    if (!goodEventData) {
      console.error(
        `required eventData not supplied to tool ${this.name}'s createNewMeasurement`
      );

      return;
    }

    const enabledElement = getEnabledElement(this.element);
    const seriesInstanceUid = getSeriesInstanceUidFromEnabledElement(
      enabledElement
    );
    const referencedStructureSet = freehand3DStore.getters.structureSet(
      seriesInstanceUid,
      'DEFAULT'
    );
    const referencedROIContour = freehand3DStore.getters.activeROIContour(
      seriesInstanceUid
    );

    const measurementData = {
      uid: generateUID(),
      seriesInstanceUid,
      structureSetUid: 'DEFAULT',
      ROIContourUid: referencedROIContour.uid,
      referencedROIContour,
      referencedStructureSet,
      visible: true,
      active: true,
      invalidated: true,
      handles: {
        points: [],
      },
    };

    measurementData.handles.textBox = {
      active: false,
      hasMoved: false,
      movesIndependently: false,
      drawnIndependently: true,
      allowedOutsideImage: true,
      hasBoundingBox: true,
    };

    freehand3DStore.setters.incrementPolygonCount(
      seriesInstanceUid,
      'DEFAULT',
      referencedROIContour.uid
    );

    return measurementData;
  }

  /**
   * Event handler for called by the mouseDownActivate event, if tool is active and
   * the event is not caught by mouseDownCallback.
   * @override
   *
   * @event
   * @param {Object} evt - The event.
   */
  addNewMeasurement(evt, interactionType) {
    const eventData = evt.detail;

    // Create metadata if it doesn't exist.
    this._addAndSetVolumeIfNoVolumes();
    this._drawing = true;

    this._startDrawing(evt);
    this._addPoint(eventData);
    preventPropagation(evt);
  }

  _addAndSetVolumeIfNoVolumes() {
    const enabledElement = getEnabledElement(this.element);
    const seriesInstanceUid = getSeriesInstanceUidFromEnabledElement(
      enabledElement
    );
    const freehand3DStore = modules.freehand3D;
    let series = freehand3DStore.getters.series(seriesInstanceUid);

    if (!series) {
      freehand3DStore.setters.series(seriesInstanceUid);
      series = freehand3DStore.getters.series(seriesInstanceUid);
    }

    const activeROIContour = freehand3DStore.getters.activeROIContour(
      seriesInstanceUid
    );

    if (!activeROIContour) {
      freehand3DStore.setters.ROIContourAndSetIndexActive(
        seriesInstanceUid,
        'DEFAULT',
        'Unnamed contour ROI'
      );
    }
  }

  /**
   * Returns a handle of a particular tool if it is close to the mouse cursor
   *
   * @private
   * @param {Object} element - The element on which the roi is being drawn.
   * @param {Object} data      Data object associated with the tool.
   * @param {*} coords
   * @returns {Number|Object|Boolean}
   */
  _pointNearHandle(element, data, coords) {
    const freehand3DStore = this._freehand3DStore;

    if (!data.handles || data.handles.points === undefined) {
      return;
    }

    if (data.visible === false) {
      return;
    }

    const points = data.handles.points;

    for (let i = 0; i < points.length; i++) {
      const handleCanvas = pixelToCanvas(element, points[i]);

      if (point.distance(handleCanvas, coords) < 6) {
        return i;
      }
    }

    // Check to see if mouse in bounding box of textbox
    if (freehand3DStore.state.displayStats && data.handles.textBox) {
      if (pointInsideBoundingBox(data.handles.textBox, coords)) {
        return data.handles.textBox;
      }
    }
  }

  /**
   * Active mouse down callback that takes priority if the user is attempting
   * to insert or delete a handle with ctrl + click.
   *
   * @param {Object} evt - The event.
   */
  preMouseDownCallback(evt) {
    const eventData = evt.detail;

    const toolData = getToolState(evt.currentTarget, this.name);

    if (!toolData) {
      return false;
    }

    const nearby = this._pointNearHandleAllTools(eventData);
    const freehand3DStore = this._freehand3DStore;

    if (eventData.event.ctrlKey) {
      if (nearby !== undefined && nearby.handleNearby.hasBoundingBox) {
        // Ctrl + clicked textBox, do nothing but still consume event.
      } else {
        insertOrDelete.call(this, evt, nearby);
      }

      preventPropagation(evt);

      return true;
    }

    if (!nearby) {
      return;
    }

    const data = toolData.data[nearby.toolIndex];

    // Check if locked and return
    const structureSet = freehand3DStore.getters.structureSet(
      data.seriesInstanceUid,
      data.structureSetUid
    );

    if (structureSet.isLocked) {
      return false;
    }

    return false;
  }

  /**
   * Custom callback for when a handle is selected.
   *
   * @param  {Object} evt
   * @param  {Object} handle The selected handle.
   */
  handleSelectedCallback(evt, data, handle, interactionType = 'mouse') {
    const freehand3DStore = this._freehand3DStore;
    const eventData = evt.detail;
    const element = eventData.element;

    if (eventData.event.metaKey) {
      this._switchROIContour(evt, data);
      preventPropagation(evt);

      return;
    }

    if (handle.hasBoundingBox && freehand3DStore.state.displayStats) {
      // Use default move handler - Can move textbox of locked ROIContours.
      moveHandleNearImagePoint(evt, this, data, handle, interactionType);
      return;
    }

    // Check if locked and return
    const structureSet = freehand3DStore.getters.structureSet(
      data.seriesInstanceUid,
      data.structureSetUid
    );

    if (structureSet.isLocked) {
      return false;
    }

    const config = this.configuration;

    config.dragOrigin = {
      x: handle.x,
      y: handle.y,
    };

    // Have to do this to get tool index.
    const nearby = this._pointNearHandleAllTools(eventData);

    if (!nearby) {
      return;
    }

    const handleNearby = nearby.handleNearby;
    const toolIndex = nearby.toolIndex;

    this._modifying = true;
    config.currentHandle = handleNearby;
    config.currentTool = toolIndex;

    this._activateModify(element);
    preventPropagation(evt);
  }

  _switchROIContour(evt, data) {
    const freehand3DStore = this._freehand3DStore;

    freehand3DStore.setters.activeROIContour(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );

    updateImage(evt.detail.element);
  }

  _addOpacityToColor(color, alpha) {
    let opacity = alpha * 255;
    opacity = Math.floor(opacity);
    const opacityStr = opacity.toString(16);

    return color + (opacity < 16 ? '0' + opacityStr : opacityStr);
  }

  /**
   *
   *
   * @param {*} evt
   * @returns
   */
  renderToolData(evt) {
    const eventData = evt.detail;
    const freehand3DStore = this._freehand3DStore;

    // If we have no toolState for this element, return immediately as there is nothing to do
    const toolState = getToolState(evt.currentTarget, this.name);

    if (!toolState) {
      return;
    }

    const { lineWidth, opacity } = freehand3DStore.configuration;

    const image = eventData.image;
    const element = eventData.element;
    const config = this.configuration;
    const seriesModule = metaData.get('generalSeriesModule', image.imageId);

    let modality;

    if (seriesModule) {
      modality = seriesModule.modality;
    }

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);

    // const lineWidth = toolStyle.getToolWidth();

    for (let i = 0; i < toolState.data.length; i++) {
      const data = toolState.data[i];
      const structureSet = data.referencedStructureSet;
      const ROIContour = data.referencedROIContour;

      if (!structureSet.visible) {
        continue;
      }

      const ROIContourData = freehand3DStore.getters.ROIContour(
        data.seriesInstanceUid,
        data.structureSetUid,
        data.ROIContourUid
      );

      if (ROIContourData === undefined) {
        continue;
      }

      if (!ROIContourData.visible) {
        continue;
      }

      const isROIActive =
        freehand3DStore.getters.ROIContourIndex(
          data.seriesInstanceUid,
          data.structureSetUid,
          data.ROIContourUid
        ) ===
        freehand3DStore.getters.activeROIContourIndex(data.seriesInstanceUid);

      draw(context, context => {
        let color = toolColors.getColorIfActive(data);
        let fillColor;

        const points = data.handles.points;

        if (data.active && !structureSet.isLocked) {
          if (data.handles.invalidHandlePlacement) {
            color = config.invalidColor;
            fillColor = config.invalidColor;
          } else {
            color = toolColors.getColorIfActive(data);
            fillColor = toolColors.getFillColor();
          }
        } else {
          const colorOpacity = this._addOpacityToColor(ROIContour.color, opacity);
          color = colorOpacity;
          fillColor = colorOpacity;
        }

        if (isROIActive && data.interpolated) {
          context.globalAlpha = config.interpolatedAlpha;
        }

        if (data.handles.points.length) {
          for (let j = 0; j < points.length; j++) {
            const lines = [...points[j].lines];

            if (j === points.length - 1 && !data.polyBoundingBox) {
              // If it's still being actively drawn, keep the last line to
              // The mouse location
              lines.push(config.mouseLocation.handles.start);
            }
            drawJoinedLines(
              context,
              eventData.element,
              data.handles.points[j],
              lines,
              {
                color,
                lineWidth
              }
            );
          }
        }

        context.globalAlpha = 1.0;

        // Draw handles

        const options = {
          color,
          fill: fillColor,
        };

        if (isROIActive && data.interpolated) {
          // Render dotted line
          options.handleRadius = config.interpolatedHandleRadius;
          drawHandles(context, eventData, points, options);
        } else if (
          config.alwaysShowHandles ||
          (data.active && data.polyBoundingBox)
        ) {
          // Render all handles
          options.handleRadius = config.activeHandleRadius;
          drawHandles(context, eventData, points, options);
        }

        if (data.canComplete) {
          // Draw large handle at the origin if can complete drawing
          options.handleRadius = config.completeHandleRadius;
          drawHandles(context, eventData, [points[0]], options);
        }

        if (data.active && !data.polyBoundingBox) {
          // Draw handle at origin and at mouse if actively drawing
          options.handleRadius = config.activeHandleRadius;
          drawHandles(
            context,
            eventData,
            config.mouseLocation.handles,
            options
          );
          drawHandles(context, eventData, [points[0]], options);
        }

        // Define variables for the area and mean/standard deviation
        let area, meanStdDev, meanStdDevSUV;

        // Perform a check to see if the tool has been invalidated. This is to prevent
        // Unnecessary re-calculation of the area, mean, and standard deviation if the
        // Image is re-rendered but the tool has not moved (e.g. during a zoom)
        if (data.invalidated === false) {
          // If the data is not invalidated, retrieve it from the toolState
          meanStdDev = data.meanStdDev;
          meanStdDevSUV = data.meanStdDevSUV;
          area = data.area;
        } else if (!data.active) {
          // If the data has been invalidated, and the tool is not currently active,
          // We need to calculate it again.

          // Retrieve the bounds of the ROI in image coordinates
          const bounds = {
            left: points[0].x,
            right: points[0].x,
            bottom: points[0].y,
            top: points[0].x,
          };

          for (let i = 0; i < points.length; i++) {
            bounds.left = Math.min(bounds.left, points[i].x);
            bounds.right = Math.max(bounds.right, points[i].x);
            bounds.bottom = Math.min(bounds.bottom, points[i].y);
            bounds.top = Math.max(bounds.top, points[i].y);
          }

          const polyBoundingBox = {
            left: bounds.left,
            top: bounds.bottom,
            width: Math.abs(bounds.right - bounds.left),
            height: Math.abs(bounds.top - bounds.bottom),
          };

          // Store the bounding box information for the text box
          data.polyBoundingBox = polyBoundingBox;

          // First, make sure this is not a color image, since no mean / standard
          // Deviation will be calculated for color images.
          if (!image.color) {
            // Retrieve the array of pixels that the ROI bounds cover
            const pixels = getPixels(
              element,
              polyBoundingBox.left,
              polyBoundingBox.top,
              polyBoundingBox.width,
              polyBoundingBox.height
            );

            // Calculate the mean & standard deviation from the pixels and the object shape
            meanStdDev = calculateFreehandStatistics.call(
              this,
              pixels,
              polyBoundingBox,
              points
            );

            if (modality === 'PT') {
              // If the image is from a PET scan, use the DICOM tags to
              // Calculate the SUV from the mean and standard deviation.

              // Note that because we are using modality pixel values from getPixels, and
              // The calculateSUV routine also rescales to modality pixel values, we are first
              // Returning the values to storedPixel values before calcuating SUV with them.
              // TODO: Clean this up? Should we add an option to not scale in calculateSUV?
              meanStdDevSUV = {
                mean: calculateSUV(
                  image,
                  (meanStdDev.mean - image.intercept) / image.slope
                ),
                stdDev: calculateSUV(
                  image,
                  (meanStdDev.stdDev - image.intercept) / image.slope
                ),
              };
            }

            // If the mean and standard deviation values are sane, store them for later retrieval
            if (meanStdDev && !isNaN(meanStdDev.mean)) {
              data.meanStdDev = meanStdDev;
              data.meanStdDevSUV = meanStdDevSUV;
            }
          }

          // Retrieve the pixel spacing values, and if they are not
          // Real non-zero values, set them to 1
          const columnPixelSpacing = image.columnPixelSpacing || 1;
          const rowPixelSpacing = image.rowPixelSpacing || 1;
          const scaling = columnPixelSpacing * rowPixelSpacing;

          area = freehandArea(points, scaling);

          // If the area value is sane, store it for later retrieval
          if (!isNaN(area)) {
            data.area = area;
          }

          // Set the invalidated flag to false so that this data won't automatically be recalculated
          data.invalidated = false;
        }

        // Only render text if polygon ROI has been completed, and is active,
        // Or config is set to show the textBox all the time
        if (
          data.polyBoundingBox &&
          (freehand3DStore.state.displayStats || data.active)
        ) {
          // If the textbox has not been moved by the user, it should be displayed on the right-most
          // Side of the tool.

          if (!data.handles.textBox.hasMoved) {
            // Find the rightmost side of the polyBoundingBox at its vertical center, and place the textbox here
            // Note that this calculates it in image coordinates
            data.handles.textBox.x =
              data.polyBoundingBox.left + data.polyBoundingBox.width;
            data.handles.textBox.y =
              data.polyBoundingBox.top + data.polyBoundingBox.height / 2;
          }

          const text = textBoxText.call(this, data);

          drawLinkedTextBox(
            context,
            element,
            data.handles.textBox,
            text,
            points,
            textBoxAnchorPoints,
            color,
            1, //lineWidth,
            0,
            true
          );
        }
      });
    }

    function textBoxText(data) {
      const ROIContour = data.referencedROIContour;
      const structureSet = data.referencedStructureSet;

      const { meanStdDev, meanStdDevSUV, area } = data;
      // Define an array to store the rows of text for the textbox
      const textLines = [];

      textLines.push(ROIContour.name);

      if (structureSet.name === 'DEFAULT') {
        textLines.push('Working ROI Collection');
      } else {
        textLines.push(structureSet.name);
      }

      // If the mean and standard deviation values are present, display them
      if (meanStdDev && meanStdDev.mean !== undefined) {
        // If the modality is CT, add HU to denote Hounsfield Units
        let moSuffix = '';

        if (modality === 'CT') {
          moSuffix = ' HU';
        }

        // Create a line of text to display the mean and any units that were specified (i.e. HU)
        let meanText = `Mean: ${numbersWithCommas(
          meanStdDev.mean.toFixed(2)
        )}${moSuffix}`;
        // Create a line of text to display the standard deviation and any units that were specified (i.e. HU)
        let stdDevText = `StdDev: ${numbersWithCommas(
          meanStdDev.stdDev.toFixed(2)
        )}${moSuffix}`;

        // If this image has SUV values to display, concatenate them to the text line
        if (meanStdDevSUV && meanStdDevSUV.mean !== undefined) {
          const SUVtext = ' SUV: ';

          meanText +=
            SUVtext + numbersWithCommas(meanStdDevSUV.mean.toFixed(2));
          stdDevText +=
            SUVtext + numbersWithCommas(meanStdDevSUV.stdDev.toFixed(2));
        }

        // Add these text lines to the array to be displayed in the textbox
        textLines.push(meanText);
        textLines.push(stdDevText);
      }

      // If the area is a sane value, display it
      if (area) {
        // Determine the area suffix based on the pixel spacing in the image.
        // If pixel spacing is present, use millimeters. Otherwise, use pixels.
        // This uses Char code 178 for a superscript 2
        let suffix = ` mm${String.fromCharCode(178)}`;

        if (!image.rowPixelSpacing || !image.columnPixelSpacing) {
          suffix = ` pixels${String.fromCharCode(178)}`;
        }

        // Create a line of text to display the area and its units
        const areaText = `Area: ${numbersWithCommas(area.toFixed(2))}${suffix}`;

        // Add this text line to the array to be displayed in the textbox
        textLines.push(areaText);
      }

      textLines.push(`${ROIContour.polygonCount} contours`);

      return textLines;
    }

    function textBoxAnchorPoints(points) {
      return points;
    }
  }

  /**
   * Ends the active drawing loop and completes the polygon.
   *
   * @private
   * @param {Object} element - The element on which the roi is being drawn.
   * @param {Object} handleNearby - the handle nearest to the mouse cursor.
   */
  _endDrawing(element, handleNearby) {
    const toolState = getToolState(element, this.name);

    const config = this.configuration;

    const data = toolState.data[config.currentTool];

    const points = data.handles.points;

    data.active = false;
    data.highlight = false;
    data.handles.invalidHandlePlacement = false;

    // Connect the end handle to the origin handle
    if (handleNearby !== undefined) {
      points[config.currentHandle - 1].lines.push(points[0]);
    }

    if (this._modifying) {
      this._modifying = false;
      data.invalidated = true;
      data.interpolated = false;
    }

    // Reset the current handle
    config.currentHandle = 0;
    config.currentTool = -1;
    data.canComplete = false;

    if (this._drawing) {
      this._drawing = false;
      this._deactivateDraw(element);
    }

    if (modules.freehand3D.state.interpolate) {
      interpolate(data, element);
    }

    updateImage(element);
  }

  /**
   * Custom callback for when toolData is deleted.
   *
   * @param  {Object} evt
   */
  _onMeasurementRemoved(evt) {
    const eventData = evt.detail;

    if (eventData.toolType !== this.name) {
      return;
    }

    const measurementData = eventData.measurementData;

    this._freehand3DStore.setters.decrementPolygonCount(
      measurementData.seriesInstanceUid,
      measurementData.structureSetUid,
      measurementData.ROIContourUid
    );
  }

  passiveCallback(element) {
    this._closeToolIfDrawing(element);
    this._addMeasurementRemovedListener(element);
  }

  enabledCallback(element) {
    this._closeToolIfDrawing(element);
    this._addMeasurementRemovedListener(element);
  }

  activeCallback(element) {
    this._addMeasurementRemovedListener(element);
  }

  disabledCallback(element) {
    this._closeToolIfDrawing(element);
    element.removeEventListener(
      EVENTS.MEASUREMENT_REMOVED,
      this._onMeasurementRemoved
    );
  }

  _addMeasurementRemovedListener(element) {
    element.removeEventListener(
      EVENTS.MEASUREMENT_REMOVED,
      this._onMeasurementRemoved
    );
    element.addEventListener(
      EVENTS.MEASUREMENT_REMOVED,
      this._onMeasurementRemoved
    );
  }
}

function defaultFreehandConfiguration() {
  return {
    mouseLocation: {
      handles: {
        start: {
          highlight: true,
          active: true,
        },
      },
    },
    spacing: 1,
    interpolatedHandleRadius: 0.5,
    interpolatedAlpha: 0.5,
    activeHandleRadius: 3,
    completeHandleRadius: 6,
    completeHandleRadiusTouch: 28,
    alwaysShowHandles: false,
    invalidColor: 'crimson',
    currentHandle: 0,
    currentTool: -1,
  };
}

function preventPropagation(evt) {
  evt.stopImmediatePropagation();
  evt.stopPropagation();
  evt.preventDefault();
}
