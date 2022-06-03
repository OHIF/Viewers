import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import getHandlesFromPoints from './utils/getHandlesFromPoints';

const Bidirectional = {
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

    const { handles } = measurementData;

    const points = [];
    const { start, end, perpendicularStart, perpendicularEnd } = handles;
    points.push({ x: start.x, y: start.y });
    points.push({ x: end.x, y: end.y });
    points.push({ x: perpendicularStart.x, y: perpendicularStart.y });
    points.push({ x: perpendicularEnd.x, y: perpendicularEnd.y });

    const longAxis = [handles.start, handles.end];
    const shortAxis = [handles.perpendicularStart, handles.perpendicularEnd];

    return {
      id: measurementData.id,
      SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: measurementData.label,
      description: measurementData.description,
      unit: measurementData.unit,
      shortestDiameter: measurementData.shortestDiameter,
      longestDiameter: measurementData.longestDiameter,
      type: getValueTypeFromToolType(tool),
      points,
      handles: measurementData.handles,
    };
  },
};

export default Bidirectional;
