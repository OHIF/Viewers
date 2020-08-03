import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const Bidirectional = {
  toAnnotation: (measurement, definition) => {
    // TODO -> Implement when this is needed.
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

    const { handles } = measurementData;

    const longAxis = [handles.start, handles.end];
    const shortAxis = [handles.perpendicularStart, handles.perpendicularEnd];

    return {
      id: measurementData.id,
      SOPInstanceUID: SOPInstanceUID,
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
      points: { longAxis, shortAxis },
    };
  },
};

export default Bidirectional;
