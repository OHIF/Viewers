import csTools from 'cornerstone-tools';
import OHIF from '../../../';

/** Internal imports */
import TOOL_NAMES from '../constants/toolNames';
import getRenderableData from './getRenderableData';

const globalImageIdSpecificToolStateManager =
  csTools.globalImageIdSpecificToolStateManager;

/**
 * Add a measurement to a display set.
 *
 * @param {*} measurement
 * @param {*} imageId
 * @param {*} displaySetInstanceUID
 */
export default function addMeasurement(
  measurement,
  imageId,
  imageMetadata,
  displaySetInstanceUID
) {
  // TODO -> Render rotated ellipse .
  const toolName = TOOL_NAMES.DICOM_SR_DISPLAY_TOOL;

  const measurementData = {
    TrackingUniqueIdentifier: measurement.TrackingUniqueIdentifier,
    TrackingIdentifier: measurement.TrackingIdentifier,
    renderableData: {},
    labels: measurement.labels,
    isSRText: measurement.isSRText,
  };

  measurement.coords.forEach(coord => {
    const { GraphicType, GraphicData, ValueType } = coord;

    if (measurementData.renderableData[GraphicType] === undefined) {
      measurementData.renderableData[GraphicType] = [];
    }
    measurementData.renderableData[GraphicType].push(
      getRenderableData(GraphicType, GraphicData, ValueType, imageMetadata)
    );
  });

  const toolState = globalImageIdSpecificToolStateManager.saveToolState();

  if (toolState[imageId] === undefined) {
    toolState[imageId] = {};
  }

  const imageIdToolState = toolState[imageId];

  // If we don't have tool state for this type of tool, add an empty object
  if (imageIdToolState[toolName] === undefined) {
    imageIdToolState[toolName] = {
      data: [],
    };
  }

  const toolData = imageIdToolState[toolName];

  measurementData.description = `Read-only annotation`;
  measurementData.isReadOnly = true;
  toolData.data.push(measurementData);

  addToMeasurementApi({ measurementData, toolName, imageId });

  measurement.loaded = true;
  measurement.imageId = imageId;
  measurement.displaySetInstanceUID = displaySetInstanceUID;

  // Remove the unneeded coord now its processed, but keep the SOPInstanceUID.
  // NOTE: We assume that each SCOORD in the MeasurementGroup maps onto one frame,
  // It'd be super werid if it didn't anyway as a SCOORD.
  measurement.ReferencedSOPInstanceUID =
    measurement.coords[0].ReferencedSOPSequence.ReferencedSOPInstanceUID;

  return measurement;
}

const addToMeasurementApi = ({ measurementData, toolName, imageId }) => {
  const measurementApi = OHIF.measurements.MeasurementApi.Instance;

  const toolType = toolName;
  const collection = measurementApi.tools[toolType];
  if (!collection) return;
  if (!measurementData || measurementData.cancelled) return;

  const imageAttributes = OHIF.measurements.getImageAttributes(null, imageId);
  const measurement = Object.assign({}, measurementData, imageAttributes, {
    lesionNamingNumber: measurementData.lesionNamingNumber,
    userId: OHIF.user.getUserId(),
    toolType,
  });

  const addedMeasurement = measurementApi.addMeasurement(toolType, measurement);
  Object.assign(measurementData, addedMeasurement);

  const measurementLabel = OHIF.measurements.getLabel(measurementData);
  if (measurementLabel) {
    measurementData.labels = [measurementLabel];
  }
};
