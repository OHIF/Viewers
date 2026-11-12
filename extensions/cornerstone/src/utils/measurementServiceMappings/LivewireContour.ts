import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { getDisplayUnit } from './utils';
import { utils } from '@ohif/core';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';
/**
 * Represents a mapping utility for Livewire measurements.
 */
const LivewireContour = {
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
    displaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType,
    customizationService
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    const isLocked = getIsLocked(annotationUID);
    const isVisible = getIsVisible(annotationUID);
    if (!metadata || !data) {
      console.warn('Livewire tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);
    if (!validToolType) {
      throw new Error(`Tool ${toolName} not supported`);
    }

    const { SOPInstanceUID, SeriesInstanceUID, frameNumber, StudyInstanceUID } =
      getSOPInstanceAttributes(referencedImageId, displaySetService, annotation);

    let displaySet;
    if (SOPInstanceUID) {
      displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
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
      referencedImageId,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      isLocked,
      isVisible,
      displayText: getDisplayText(annotation, displaySet, displaySetService),
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
  const columns = [];
  const values = [];

  /** Add type */
  columns.push('AnnotationType');
  values.push('Cornerstone:Livewire');

  /** Add cachedStats */
  const { metadata, data } = annotation;

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
 * @returns {object} - An object with primary and secondary text arrays.
 */
function getDisplayText(annotation, displaySet, displaySetService) {
  const { metadata, data } = annotation;

  const displayText = {
    primary: [],
    secondary: [],
  };

  if (!data.cachedStats || !data.cachedStats[`imageId:${metadata.referencedImageId}`]) {
    return displayText;
  }

  const { area, areaUnit } = data.cachedStats[`imageId:${metadata.referencedImageId}`];

  const { SOPInstanceUID, frameNumber } = getSOPInstanceAttributes(
    metadata.referencedImageId,
    displaySetService,
    annotation
  );

  const instance = displaySet.instances.find(image => image.SOPInstanceUID === SOPInstanceUID);
  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  const { SeriesNumber } = displaySet;
  let seriesText = null;
  if (SeriesNumber !== undefined) {
    seriesText = `S: ${SeriesNumber}${instanceText}${frameText}`;
  }

  if (area) {
    const roundedArea = utils.roundNumber(area || 0, 2);
    displayText.primary.push(`${roundedArea} ${getDisplayUnit(areaUnit)}`);
  }

  if (seriesText) {
    displayText.secondary.push(seriesText);
  }

  return displayText;
}

export default LivewireContour;
