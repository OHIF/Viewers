import SUPPORTED_TOOLS from './constants/supportedTools';
import getPointsFromHandles from './utils/getPointsFromHandles';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const ArrowAnnotate = {
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

    const displaySets = DisplaySetService.getDisplaySetsForSeries(
      SeriesInstanceUID
    );
    const displaySet = displaySets.find(ds => {
      return (
        ds.images && ds.images.some(i => i.SOPInstanceUID === SOPInstanceUID)
      );
    });

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
