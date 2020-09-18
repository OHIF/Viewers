import cornerstoneTools, {
  importInternal,
  getToolState,
  toolColors,
  getModule,
  globalImageIdSpecificToolStateManager,
} from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import drawCanvasCrosshairs from '../utils/drawCanvasCrosshairs';
import TOOL_NAMES from './TOOL_NAMES';

const { DICOM_SEG_TEMP_CROSSHAIRS_TOOL } = TOOL_NAMES;
const { getters } = getModule('segmentation');

// Cornerstone 3rd party dev kit imports
const BaseTool = importInternal('base/BaseTool');

/**
 * @class RTStructDisplayTool - Renders RTSTRUCT data in a read only manner (i.e. as an overlay).
 * @extends cornerstoneTools.BaseTool
 */
export default class DICOMSegTempCrosshairsTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      mixins: ['enabledOrDisabledBinaryTool'],
      name: DICOM_SEG_TEMP_CROSSHAIRS_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    this._rtStructModule = cornerstoneTools.getModule('rtstruct');
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const { element } = eventData;
    const toolState = getToolState(evt.currentTarget, this.name);

    if (!toolState) {
      return;
    }

    // We have tool data for this element - iterate over each one and draw it

    for (let i = 0; i < toolState.data.length; i++) {
      const data = toolState.data[i];
      const crossHairCenter = data.center;

      drawCanvasCrosshairs(eventData, crossHairCenter, {
        color: toolColors.getActiveColor(),
        lineWidth: 1,
      });

      // Remove the crosshairs, we only render them for one redraw.
      toolState.data.pop();
    }
  }
}

DICOMSegTempCrosshairsTool.addCrosshair = (element, imageId, segmentNumber) => {
  const labelmap3D = getters.labelmap3D(element);
  const stackToolState = cornerstoneTools.getToolState(element, 'stack');
  const enabledElement = cornerstone.getEnabledElement(element);

  const { rows, columns } = enabledElement.image;

  if (!stackToolState) {
    return;
  }

  const imageIds = stackToolState.data[0].imageIds;
  const imageIdIndex = imageIds.findIndex(imgId => imgId === imageId);

  const labelmap2D = labelmap3D.labelmaps2D[imageIdIndex];
  const { pixelData } = labelmap2D;

  let xCenter = 0;
  let yCenter = 0;

  let count = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (pixelData[y * columns + x] === segmentNumber) {
        count++;
        xCenter += x + 0.5;
        yCenter += y + 0.5;
      }
    }
  }

  xCenter /= count;
  yCenter /= count;

  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();

  if (!globalToolState[imageId]) {
    globalToolState[imageId] = {};
  }

  const imageIdSpecificToolState = globalToolState[imageId];

  if (!imageIdSpecificToolState[DICOM_SEG_TEMP_CROSSHAIRS_TOOL]) {
    imageIdSpecificToolState[DICOM_SEG_TEMP_CROSSHAIRS_TOOL] = { data: [] };
  } else if (!imageIdSpecificToolState[DICOM_SEG_TEMP_CROSSHAIRS_TOOL].data) {
    imageIdSpecificToolState[DICOM_SEG_TEMP_CROSSHAIRS_TOOL].data = [];
  }

  const toolSpecificData =
    imageIdSpecificToolState[DICOM_SEG_TEMP_CROSSHAIRS_TOOL].data;

  toolSpecificData.push({ center: { x: xCenter, y: yCenter }, segmentNumber });

  // Enable the tool if not enabled for the element.

  const tool = cornerstoneTools.getToolForElement(
    element,
    DICOM_SEG_TEMP_CROSSHAIRS_TOOL
  );

  if (tool.mode !== 'enabled') {
    // If not already active or passive, set passive so contours render.
    cornerstoneTools.setToolEnabled(DICOM_SEG_TEMP_CROSSHAIRS_TOOL);
  }
};
