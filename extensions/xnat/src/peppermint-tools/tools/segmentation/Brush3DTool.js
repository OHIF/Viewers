import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import generateSegmentationMetadata from '../../utils/generateSegmentationMetadata.js';
import TOOL_NAMES from '../../toolNames';

const { BrushTool } = cornerstoneTools;
const { getCircle, drawBrushPixels } = cornerstoneTools.importInternal(
  'util/segmentationUtils'
);
const segmentationModule = cornerstoneTools.getModule('segmentation');
const triggerEvent = cornerstoneTools.importInternal('util/triggerEvent');

export default class Brush3DTool extends BrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.BRUSH_3D_TOOL,
    };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  /**
   * Initialise painting with baseBrushTool
   *
   * @override @protected
   * @event
   * @param {Object} evt - The event.
   */
  _startPainting(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const { configuration, getters } = segmentationModule;

    const {
      labelmap2D,
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
    } = getters.labelmap2D(element);

    const shouldErase =
      this._isCtrlDown(eventData) || this.configuration.alwaysEraseOnClick;

    this.paintEventData = {
      labelmap2D,
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      shouldErase,
    };

    if (configuration.storeHistory) {
      const previousPixelData = labelmap2D.pixelData.slice();

      this.paintEventData.previousPixelData = previousPixelData;
    }

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    if (!metadata) {
      metadata = generateSegmentationMetadata('Unnamed Segment');

      segmentIndex = labelmap3D.activeSegmentIndex = 1;

      segmentationModule.setters.metadata(
        element,
        activeLabelmapIndex,
        segmentIndex,
        metadata
      );

      console.log('TRIGGERING EVENT');
      triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
    }
  }

  /**
   * Paints the data to the labelmap.
   *
   * @protected
   * @param  {Object} evt The data object associated with the event.
   * @returns {void}
   */
  _paint(evt) {
    const { configuration } = segmentationModule;
    const eventData = evt.detail;
    const element = eventData.element;
    const { rows, columns } = eventData.image;
    const { x, y } = eventData.currentPoints.image;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = configuration.radius;
    const pointerArray = getCircle(radius, rows, columns, x, y);

    const { labelmap2D, labelmap3D, shouldErase } = this.paintEventData;

    // Draw / Erase the active color.
    drawBrushPixels(
      pointerArray,
      labelmap2D.pixelData,
      labelmap3D.activeSegmentIndex,
      columns,
      shouldErase
    );

    if (labelmap3D.isFractional) {
      this._setProbabilityOfFractionalTo100(pointerArray, rows, columns);
    }

    cornerstone.updateImage(evt.detail.element);
  }

  _setProbabilityOfFractionalTo100(pointerArray, rows, columns) {
    const {
      currentImageIdIndex,
      labelmap3D,
      shouldErase,
    } = this.paintEventData;

    const value = shouldErase ? 0 : 255;

    const { probabilityBuffer } = labelmap3D;

    const sliceLength = rows * columns;
    const byteOffset = sliceLength * currentImageIdIndex;

    const uInt8ProbabilityBufferView = new Uint8Array(
      probabilityBuffer,
      byteOffset,
      sliceLength
    );

    pointerArray.forEach(point => {
      const pixelIndex = point[0] + point[1] * columns;

      uInt8ProbabilityBufferView[pixelIndex] = value;
    });
  }
}
