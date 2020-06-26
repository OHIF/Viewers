import SUPPORTED_TOOLS from './constants/supportedTools';
import getPointsFromHandles from './utils/getPointsFromHandles';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const ArrowAnnotate = {
  toAnnotation: (measurement, definition) => {
    // TODO -> Implement when this is needed.
  },
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
      referencedSeriesUID: SeriesInstanceUID,
      referencedStudyUID: StudyInstanceUID,
      label: measurementData.text,
      description: measurementData.description,
      unit: measurementData.unit,
      text: measurementData.text,
      type: getValueTypeFromToolType(tool),
      points: getPointsFromHandles(measurementData.handles),
    };
  },
};

export default ArrowAnnotate;
