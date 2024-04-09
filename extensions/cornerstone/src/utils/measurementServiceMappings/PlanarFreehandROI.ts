import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { getDisplayUnit } from './utils';
import { utils } from '@ohif/core';

/**
 * Represents a mapping utility for Planar Freehand ROI measurements.
 */
const PlanarFreehandROI = {
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
    getValueTypeFromToolType
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('PlanarFreehandROI tool: Missing metadata or data');
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
      displayText: getDisplayText(annotation, displaySet),
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport: () => getColumnValueReport(annotation),
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
function getColumnValueReport(annotation) {
  const columns = [];
  const values = [];

  /** Add type */
  columns.push('AnnotationType');
  values.push('Cornerstone:PlanarFreehandROI');

  /** Add cachedStats */
  const { metadata, data } = annotation;
  const { mean, max, area, unit } = data.cachedStats[`imageId:${metadata.referencedImageId}`];
  columns.push(`Maximum`, `Mean`, `Area`, 'Unit');
  values.push(max, mean, area, unit);

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
function getDisplayText(annotation, displaySet) {
  const { metadata, data } = annotation;

  if (!data.cachedStats || !data.cachedStats[`imageId:${metadata.referencedImageId}`]) {
    return [];
  }

  const { mean, max, area, modalityUnit, areaUnit } =
    data.cachedStats[`imageId:${metadata.referencedImageId}`];

  const { SOPInstanceUID, frameNumber } = getSOPInstanceAttributes(metadata.referencedImageId);

  const displayText = [];

  const instance = displaySet.images.find(image => image.SOPInstanceUID === SOPInstanceUID);
  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  const { SeriesNumber } = displaySet;
  if (SeriesNumber) {
    displayText.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  }

  if (area) {
    /**
     * Add Area
     * Area sometimes becomes undefined if `preventHandleOutsideImage` is off
     */
    const roundedArea = utils.roundNumber(area || 0, 2);
    displayText.push(`${roundedArea} ${getDisplayUnit(areaUnit)}`);
  }

  if (mean) {
    if (Array.isArray(mean)) {
      const meanValues = mean.map(value => utils.roundNumber(value));
      displayText.push(`Mean: ${meanValues.join(', ')} ${modalityUnit}`);
    } else {
      displayText.push(`Mean: ${utils.roundNumber(mean)} ${modalityUnit}`);
    }
  }

  if (max) {
    if (Array.isArray(max)) {
      const maxValues = max.map(value => utils.roundNumber(value, 2));
      displayText.push(`Max: ${maxValues.join(', ')} ${modalityUnit}`);
    } else {
      displayText.push(`Max: ${utils.roundNumber(max, 2)} ${modalityUnit}`);
    }
  }

  return displayText;
}

export default PlanarFreehandROI;
