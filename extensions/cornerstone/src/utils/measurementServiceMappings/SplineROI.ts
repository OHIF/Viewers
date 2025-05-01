import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';
import { getDisplayUnit } from './utils';
import { getStatisticDisplayString } from './utils/getValueDisplayString';

/**
 * Represents a mapping utility for Spline ROI measurements.
 */
const SplineROI = {
  toAnnotation: measurement => {
    // Implementation for converting measurement to annotation
  },

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} csToolsEventDetail - Cornerstone event data
   * @param {DisplaySetService} displaySetService - Service for managing display sets
   * @param {CornerstoneViewportService} CornerstoneViewportService - Service for managing viewports
   * @param {Function} getValueTypeFromToolType - Function to get value type from tool type
   * @param {CustomizationService} customizationService - Service for customization
   * @returns {Measurement | null} Measurement instance or null if invalid
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
      console.warn('SplineROI tool: Missing metadata or data');
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
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    }

    const mappedAnnotations = getMappedAnnotations(annotation, displaySetService);
    const displayText = getDisplayText(mappedAnnotations, displaySet);

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
      referencedImageId,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport: () => getColumnValueReport(annotation, customizationService),
      isLocked,
      isVisible,
    };
  },
};

/**
 * Maps annotations to a structured format with relevant attributes.
 *
 * @param {Object} annotation - The annotation object.
 * @param {DisplaySetService} displaySetService - Service for managing display sets.
 * @returns {Array} Mapped annotations.
 */
function getMappedAnnotations(annotation, displaySetService) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const { referencedImageId } = metadata;
  const targets = Object.keys(cachedStats);

  if (!targets.length) {
    return [];
  }

  const annotations = [];
  Object.keys(cachedStats).forEach(targetId => {
    const targetStats = cachedStats[targetId];

    const { SOPInstanceUID, SeriesInstanceUID, frameNumber } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    const displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];

    const { SeriesNumber } = displaySet;
    const { mean, stdDev, max, area, Modality, areaUnit, modalityUnit } = targetStats;

    annotations.push({
      SeriesInstanceUID,
      SOPInstanceUID,
      SeriesNumber,
      frameNumber,
      Modality,
      unit: modalityUnit,
      mean,
      stdDev,
      max,
      area,
      areaUnit,
    });
  });

  return annotations;
}

/**
 * Converts the measurement data to a format suitable for report generation.
 *
 * @param {object} annotation - The annotation object.
 * @param {CustomizationService} customizationService - Service for customization.
 * @returns {object} Report's content.
 */
function getColumnValueReport(annotation, customizationService) {
  const { SplineROI } = customizationService.getCustomization('cornerstone.measurements');
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
    columns.push('points');
    values.push(data.contour.polyline.map(p => p.join(' ')).join(';'));
  }

  return { columns, values };
}

/**
 * Retrieves the display text for an annotation in a display set.
 *
 * @param {Array} mappedAnnotations - The mapped annotations.
 * @param {Object} displaySet - The display set object.
 * @returns {Object} Display text with primary and secondary information.
 */
function getDisplayText(mappedAnnotations, displaySet) {
  const displayText = {
    primary: [],
    secondary: [],
  };

  if (!mappedAnnotations || !mappedAnnotations.length) {
    return displayText;
  }

  // Area is the same for all series
  const { area, SOPInstanceUID, frameNumber, areaUnit } = mappedAnnotations[0];

  const instance = displaySet.instances.find(image => image.SOPInstanceUID === SOPInstanceUID);

  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  const roundedArea = utils.roundNumber(area || 0, 2);
  displayText.primary.push(`${roundedArea} ${getDisplayUnit(areaUnit)}`);

  // we don't have max yet for splines rois
  // mappedAnnotations.forEach(mappedAnnotation => {
  //   const { unit, max, SeriesNumber } = mappedAnnotation;

  //   const maxStr = getStatisticDisplayString(max, unit, 'max');

  //   displayText.primary.push(maxStr);
  //   displayText.secondary.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  // });

  return displayText;
}

export default SplineROI;
