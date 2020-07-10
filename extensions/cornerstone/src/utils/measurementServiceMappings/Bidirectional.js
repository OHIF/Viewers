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
      FrameNumber,
    } = getSOPInstanceAttributes(element);

    const displaySets = DisplaySetService.getDisplaySetsForSeries(
      SeriesInstanceUID
    );
    const displaySet = displaySets.find(ds => {
      return (
        ds.images && ds.images.some(i => i.SOPInstanceUID === SOPInstanceUID)
      );
    });

    const { handles } = measurementData;

    const longAxis = [handles.start, handles.end];
    const shortAxis = [handles.perpendicularStart, handles.perpendicularEnd];

    return {
      id: measurementData.id,
      SOPInstanceUID: SOPInstanceUID,
      FrameOfReferenceUID,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      FrameNumber,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: measurementData.text,
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
