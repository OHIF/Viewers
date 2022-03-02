import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import getHandlesFromPoints from './utils/getHandlesFromPoints';

const CobbAngle = {
  toAnnotation: (measurement, definition) => { },
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

    const { handles, rAngle } = measurementData;

    const { start, end, start2, end2 } = handles;

    const points = [start, end, start2, end2];

    return {
      id: measurementData.id,
      SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: measurementData.label,
      description: measurementData.description,
      unit: "\xB0",
      length: rAngle,
      rAngle,
      type: getValueTypeFromToolType(tool),
      points,
    };
  },
};

export default CobbAngle;
