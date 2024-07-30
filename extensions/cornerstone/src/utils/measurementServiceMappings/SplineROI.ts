import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';

/**
 * Represents a mapping utility for Spline ROI measurements.
 */
const SplineROI = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} csToolsEventDetail Cornerstone event data
   * @param {DisplaySetService} DisplaySetService Service for managing display sets
   * @param {CornerstoneViewportService} CornerstoneViewportService Service for managing viewports
   * @param {Function} getValueTypeFromToolType Function to get value type from tool type
   * @returns {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsEventDetail,
    DisplaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType,
    customizationService
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('SplineROI tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);
    if (!validToolType) {
      throw new Error(`Tool ${toolName} not supported`);
    }

    const { SOPInstanceUID, SeriesInstanceUID, frameNumber, StudyInstanceUID } =
      getSOPInstanceAttributes(referencedImageId);

    let displaySet;
    if (SOPInstanceUID) {
      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points: data.contour.polyline,
      textBox: data.handles.textBox,
      metadata,
      frameNumber,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText: getDisplayText(annotation, displaySet, customizationService),
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport: () => getColumnValueReport(annotation, customizationService),
    };
  },
};

/**
 * This function is used to convert the measurement data to a
 * format that is suitable for report generation (e.g. for the csv report).
 * The report returns a list of columns and corresponding values.
 *
 * @param {object} annotation
 * @returns {object} Report's content from this tool
 */
function getColumnValueReport(annotation, customizationService) {
  const { SplineROI } = customizationService.get('cornerstone.measurements');
  const { report } = SplineROI;
  const columns = [];
  const values = [];

  /** Add type */
  columns.push('AnnotationType');
  values.push('Cornerstone:SplineROI');

  /** Add cachedStats */
  const { metadata, data } = annotation;
  const stats = data.cachedStats[`imageId:${metadata.referencedImageId}`];

  report.forEach(({ name, value }) => {
    columns.push(name);
    stats[value] ? values.push(stats[value]) : values.push('not available');
  });

  /** Add FOR */
  if (metadata.FrameOfReferenceUID) {
    columns.push('FrameOfReferenceUID');
    values.push(metadata.FrameOfReferenceUID);
  }

  /** Add points */
  if (data.contour.polyline) {
    /**
     * Points has the form of [[x1, y1, z1], [x2, y2, z2], ...]
     * convert it to string of [[x1 y1 z1];[x2 y2 z2];...]
     * so that it can be used in the CSV report
     */
    columns.push('points');
    values.push(data.contour.polyline.map(p => p.join(' ')).join(';'));
  }

  return { columns, values };
}

/**
 * Retrieves the display text for an annotation in a display set.
 *
 * @param {Object} annotation - The annotation object.
 * @param {Object} displaySet - The display set object.
 * @returns {string[]} - An array of display text.
 */
function getDisplayText(annotation, displaySet, customizationService) {
  const { SplineROI } = customizationService.get('cornerstone.measurements');
  const { displayText } = SplineROI;
  const { metadata, data } = annotation;

  if (!data.cachedStats || !data.cachedStats[`imageId:${metadata.referencedImageId}`]) {
    return [];
  }
  const { SOPInstanceUID, frameNumber } = getSOPInstanceAttributes(metadata.referencedImageId);

  const displayTextArray = [];

  const instance = displaySet.images.find(image => image.SOPInstanceUID === SOPInstanceUID);
  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  const { SeriesNumber } = displaySet;
  if (SeriesNumber) {
    displayTextArray.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  }

  const stats = data.cachedStats[`imageId:${metadata.referencedImageId}`];

  const roundValues = values => {
    if (Array.isArray(values)) {
      return values.map(value => {
        if (isNaN(value)) {
          return value;
        }
        return utils.roundNumber(value);
      });
    }
    return isNaN(values) ? values : utils.roundNumber(values);
  };

  const findUnitForValue = (displayTextItems, value) =>
    displayTextItems.find(({ type, for: filter }) => type === 'unit' && filter.includes(value))
      ?.value;

  const formatDisplayText = (displayName, result, unit) =>
    `${displayName}: ${Array.isArray(result) ? roundValues(result).join(', ') : roundValues(result)} ${unit}`;

  displayText.forEach(({ displayName, value, type }) => {
    if (type === 'value') {
      const result = stats[value];
      const unit = stats[findUnitForValue(displayText, value)] || '';
      displayTextArray.push(formatDisplayText(displayName, result, unit));
    }
  });

  return displayTextArray;
}

export default SplineROI;
