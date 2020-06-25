import SUPPORTED_TOOLS from './constants/supportedTools';
import getHandlesFromPoints from './utils/getHandlesFromPoints';
import getPointsFromHandles from './utils/getPointsFromHandles';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const Length = {
  toAnnotation: (measurement, definition) => {
    const {
      id,
      label,
      description,
      points,
      unit,
      SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID,
    } = measurement;

    return {
      toolName: definition,
      measurementData: {
        sopInstanceUid: SOPInstanceUID,
        frameOfReferenceUID: FrameOfReferenceUID,
        SeriesInstanceUID: referenceSeriesUID,
        unit,
        text: label,
        description,
        handles: getHandlesFromPoints(points),
        _measurementServiceId: id,
      },
    };
  },

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (csToolsAnnotation, getValueTypeFromToolType) => {
    const { element, measurementData } = csToolsAnnotation;
    const tool =
      csToolsAnnotation.toolType ||
      csToolsAnnotation.toolName ||
      measurementData.toolType;

    const validToolType = toolName => SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType(tool)) {
      throw new Error('Tool not supported');
    }

    const {
      SOPInstanceUID,
      FrameOfReferenceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = getSOPInstanceAttributes(element);

    const points = [];
    points.push(measurementData.handles);

    return {
      id: measurementData._measurementServiceId,
      SOPInstanceUID: SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      label: measurementData.text,
      description: measurementData.description,
      unit: measurementData.unit,
      length: measurementData.length,
      type: getValueTypeFromToolType(tool),
      points: getPointsFromHandles(measurementData.handles),
    };
  },
};

export default Length;
