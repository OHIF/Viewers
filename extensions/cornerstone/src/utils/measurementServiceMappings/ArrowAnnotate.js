import SUPPORTED_TOOLS from './constants/supportedTools';
import getPointsFromHandles from './utils/getPointsFromHandles';
import getHandlesFromPoints from './utils/getHandlesFromPoints';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const ArrowAnnotate = {
  toAnnotation: (measurement, definition) => {
    /* TODO: To be finished/updated. */
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
        id,
      },
    };
  },
  toMeasurement: (
    csToolsAnnotation,
    DisplaySetService,
    getValueTypeFromToolType
  ) => {
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

    const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
      SOPInstanceUID,
      SeriesInstanceUID
    );

    const points = [];
    points.push(measurementData.handles);

    return {
      id: measurementData.id,
      SOPInstanceUID: SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
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
