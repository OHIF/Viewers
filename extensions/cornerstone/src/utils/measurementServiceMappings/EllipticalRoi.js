import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import getHandlesFromPoints from './utils/getHandlesFromPoints';

const EllipticalRoi = {
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

    const { start, end } = measurementData.handles;

    const halfXLength = Math.abs(start.x - end.x) / 2;
    const halfYLength = Math.abs(start.y - end.y) / 2;

    const points = [];
    const center = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    // To store similar to SR.
    if (halfXLength > halfYLength) {
      // X-axis major
      // Major axis
      points.push({ x: center.x - halfXLength, y: center.y });
      points.push({ x: center.x + halfXLength, y: center.y });
      // Minor axis
      points.push({ x: center.x, y: center.y - halfYLength });
      points.push({ x: center.x, y: center.y + halfYLength });
    } else {
      // Y-axis major
      // Major axis
      points.push({ x: center.x, y: center.y - halfYLength });
      points.push({ x: center.x, y: center.y + halfYLength });
      // Minor axis
      points.push({ x: center.x - halfXLength, y: center.y });
      points.push({ x: center.x + halfXLength, y: center.y });
    }

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
      area:
        measurementData.cachedStats &&
        measurementData.cachedStats
          .area /* TODO: Add concept names instead (descriptor) */,
      type: getValueTypeFromToolType(tool),
      points,
    };
  },
};

export default EllipticalRoi;
