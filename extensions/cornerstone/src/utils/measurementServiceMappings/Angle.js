import SUPPORTED_TOOLS from './constants/supportedTools';
import getPointsFromHandles from './utils/getPointsFromHandles';
import getHandlesFromPoints from './utils/getHandlesFromPoints';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const Angle = {
  toAnnotation: (measurement, definition) => {},
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
    const { start, middle, end } = measurementData.handles;
    points.push({ x: start.x, y: start.y });
    points.push({ x: middle.x, y: middle.y });
    points.push({ x: end.x, y: end.y });

    return {
      id: measurementData.id,
      SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: measurementData.text,
      description: measurementData.description,
      angle: measurementData.rAngle,
      type: getValueTypeFromToolType(tool),
      points,
      handles: measurementData.handles,
    };
  },
};

export default Angle;
