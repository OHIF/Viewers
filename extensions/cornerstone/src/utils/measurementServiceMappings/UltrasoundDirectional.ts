import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';
const UltrasoundDirectional = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
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
      console.warn('Length tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } =
      getSOPInstanceAttributes(referencedImageId);

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(annotation, displaySetService);

    const displayText = getDisplayText(mappedAnnotations, displaySet, customizationService);
    const getReport = () =>
      _getReport(mappedAnnotations, points, FrameOfReferenceUID, customizationService);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      frameNumber: mappedAnnotations?.[0]?.frameNumber || 1,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport,
      isLocked,
      isVisible,
    };
  },
};

function getMappedAnnotations(annotation, DisplaySetService) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const { referencedImageId } = metadata;
  const targets = Object.keys(cachedStats);

  if (!targets.length) {
    return;
  }

  const annotations = [];
  Object.keys(cachedStats).forEach(targetId => {
    const targetStats = cachedStats[targetId];

    if (!referencedImageId) {
      throw new Error('Non-acquisition plane measurement mapping not supported');
    }

    const { SOPInstanceUID, SeriesInstanceUID, frameNumber } =
      getSOPInstanceAttributes(referencedImageId);

    const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
      SOPInstanceUID,
      SeriesInstanceUID,
      frameNumber
    );

    const { SeriesNumber } = displaySet;
    const { xValues, yValues, units, isUnitless, isHorizontal } = targetStats;

    annotations.push({
      SeriesInstanceUID,
      SOPInstanceUID,
      SeriesNumber,
      frameNumber,
      xValues,
      yValues,
      units,
      isUnitless,
      isHorizontal,
    });
  });

  return annotations;
}

/*
This function is used to convert the measurement data to a format that is
suitable for the report generation (e.g. for the csv report). The report
returns a list of columns and corresponding values.
*/
function _getReport(mappedAnnotations, points, FrameOfReferenceUID, customizationService) {
  const columns = [];
  const values = [];

  // Add Type
  columns.push('AnnotationType');
  values.push('Cornerstone:UltrasoundDirectional');

  mappedAnnotations.forEach(annotation => {
    const { xValues, yValues, units, isUnitless } = annotation;
    if (isUnitless) {
      columns.push('Length' + units[0]);
      values.push(utils.roundNumber(xValues[0], 2));
    } else {
      const dist1 = Math.abs(xValues[1] - xValues[0]);
      const dist2 = Math.abs(yValues[1] - yValues[0]);
      columns.push('Time' + units[0]);
      values.push(utils.roundNumber(dist1, 2));
      columns.push('Length' + units[1]);
      values.push(utils.roundNumber(dist2, 2));
    }
  });

  if (FrameOfReferenceUID) {
    columns.push('FrameOfReferenceUID');
    values.push(FrameOfReferenceUID);
  }

  if (points) {
    columns.push('points');
    values.push(points.map(p => p.join(' ')).join(';'));
  }

  return {
    columns,
    values,
  };
}

function getDisplayText(mappedAnnotations, displaySet, customizationService) {
  const displayText = {
    primary: [],
    secondary: [],
  };

  if (!mappedAnnotations || !mappedAnnotations.length) {
    return displayText;
  }

  const { xValues, yValues, units, isUnitless, SeriesNumber, SOPInstanceUID, frameNumber } =
    mappedAnnotations[0];

  const instance = displaySet.instances.find(image => image.SOPInstanceUID === SOPInstanceUID);

  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';
  const seriesText = `S: ${SeriesNumber}${instanceText}${frameText}`;

  if (xValues === undefined || yValues === undefined) {
    return displayText;
  }

  if (isUnitless) {
    displayText.primary.push(`${utils.roundNumber(xValues[0], 2)} ${units[0]}`);
  } else {
    const dist1 = Math.abs(xValues[1] - xValues[0]);
    const dist2 = Math.abs(yValues[1] - yValues[0]);
    displayText.primary.push(`${utils.roundNumber(dist1)} ${units[0]}`);
    displayText.primary.push(`${utils.roundNumber(dist2)} ${units[1]}`);
  }

  displayText.secondary.push(seriesText);

  return displayText;
}

export default UltrasoundDirectional;
