import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import getHandlesFromPoints from './utils/getHandlesFromPoints';

const EllipticalRoi = {
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

    const { cachedStats, handles } = measurementData;

    const { start, end } = handles;

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

    let meanSUV;
    let stdDevSUV;

    if (
      cachedStats &&
      cachedStats.meanStdDevSUV &&
      cachedStats.meanStdDevSUV.mean !== 0
    ) {
      const { meanStdDevSUV } = cachedStats;

      meanSUV = meanStdDevSUV.mean;
      stdDevSUV = meanStdDevSUV.stdDev;
    }

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
      area: cachedStats && cachedStats.area,
      mean: cachedStats && cachedStats.mean,
      stdDev: cachedStats && cachedStats.stdDev,
      meanSUV,
      stdDevSUV,
      type: getValueTypeFromToolType(tool),
      points,
    };
  },
};

export default EllipticalRoi;
