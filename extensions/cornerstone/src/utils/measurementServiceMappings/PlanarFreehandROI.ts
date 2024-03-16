import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';

const PlanarFreehandROI = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsEventDetail,
    DisplaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType
  ) => {
    const { annotation, viewportId } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('PlanarFreehandROI tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = getSOPInstanceAttributes(
      referencedImageId,
      CornerstoneViewportService,
      viewportId
    );

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { points, textBox } = data.handles;

    const mappedAnnotations = getMappedAnnotations(annotation, DisplaySetService);

    const displayText = getDisplayText(mappedAnnotations);
    const getReport = () => _getReport(mappedAnnotations, points, FrameOfReferenceUID);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      textBox,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText: displayText,
      data: { ...data, ...data.cachedStats },
      type: getValueTypeFromToolType(toolName),
      getReport,
    };
  },
};

/**
 * It maps an imaging library annotation to a list of simplified annotation properties.
 *
 * @param {Object} annotationData
 * @param {Object} DisplaySetService
 * @returns
 */
function getMappedAnnotations(annotationData, DisplaySetService) {
  const { metadata, data } = annotationData;
  const { label } = data;
  const { referencedImageId } = metadata;

  const annotations = [];

  const { SOPInstanceUID: _SOPInstanceUID, SeriesInstanceUID: _SeriesInstanceUID } =
    getSOPInstanceAttributes(referencedImageId) || {};

  if (!_SOPInstanceUID || !_SeriesInstanceUID) {
    return annotations;
  }

  const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
    _SOPInstanceUID,
    _SeriesInstanceUID
  );

  const { SeriesNumber, SeriesInstanceUID } = displaySet;

  annotations.push({
    SeriesInstanceUID,
    SeriesNumber,
    label,
    data,
  });

  return annotations;
}

/**
 * TBD
 * This function is used to convert the measurement data to a format that is suitable for the report generation (e.g. for the csv report).
 * The report returns a list of columns and corresponding values.
 * @param {*} mappedAnnotations
 * @param {*} points
 * @param {*} FrameOfReferenceUID
 * @returns Object representing the report's content for this tool.
 */
function _getReport(mappedAnnotations, points, FrameOfReferenceUID) {
  const columns = [];
  const values = [];

  return {
    columns,
    values,
  };
}

function getDisplayText(mappedAnnotations) {
  return '';
}

export default PlanarFreehandROI;
