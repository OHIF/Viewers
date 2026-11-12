import SUPPORTED_TOOLS from './constants/supportedTools';
import { getDisplayUnit } from './utils';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';
import { getStatisticDisplayString } from './utils/getValueDisplayString';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';

const RectangleROI = {
  toAnnotation: measurement => {},
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
      console.warn('Rectangle ROI tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    }

    const { points, textBox } = data.handles;

    const mappedAnnotations = getMappedAnnotations(annotation, displaySetService);

    const displayText = getDisplayText(mappedAnnotations, displaySet, customizationService);
    const getReport = () =>
      _getReport(mappedAnnotations, points, FrameOfReferenceUID, customizationService);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      textBox,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      referencedImageId,
      frameNumber: mappedAnnotations[0]?.frameNumber || 1,
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

function getMappedAnnotations(annotation, displaySetService) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const { referencedImageId } = metadata;
  const targets = Object.keys(cachedStats);

  if (!targets.length) {
    return [];
  }

  const annotations = [];

  const addedModalities = new Set();
  Object.keys(cachedStats).forEach(targetId => {
    const targetStats = cachedStats[targetId];

    const { SOPInstanceUID, SeriesInstanceUID, frameNumber } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    const displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];

    const { SeriesNumber } = displaySet;
    const { mean, stdDev, max, area, Modality, modalityUnit, areaUnit } = targetStats;

    // Skip if we've already added this modality
    if (Modality && addedModalities.has(Modality)) {
      return;
    }

    // Add modality to the set if it exists
    if (Modality) {
      addedModalities.add(Modality);
    }

    annotations.push({
      SeriesInstanceUID,
      SOPInstanceUID,
      SeriesNumber,
      frameNumber,
      Modality,
      unit: modalityUnit,
      mean,
      stdDev,
      metadata,
      max,
      area,
      areaUnit,
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
  values.push('Cornerstone:RectangleROI');

  mappedAnnotations.forEach(annotation => {
    const { mean, stdDev, max, area, unit, areaUnit } = annotation;

    if (!mean || !unit || !max || !area) {
      return;
    }

    columns.push(`Maximum`, `Mean`, `Std Dev`, 'Pixel Unit', `Area`, 'Unit');
    values.push(max, mean, stdDev, unit, area, areaUnit);
  });

  if (FrameOfReferenceUID) {
    columns.push('FrameOfReferenceUID');
    values.push(FrameOfReferenceUID);
  }

  if (points) {
    columns.push('points');
    // points has the form of [[x1, y1, z1], [x2, y2, z2], ...]
    // convert it to string of [[x1 y1 z1];[x2 y2 z2];...]
    // so that it can be used in the csv report
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

  // Area is the same for all series
  const { area, SOPInstanceUID, frameNumber, areaUnit } = mappedAnnotations[0];

  const instance = displaySet.instances.find(image => image.SOPInstanceUID === SOPInstanceUID);

  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  // Area sometimes becomes undefined if `preventHandleOutsideImage` is off.
  const roundedArea = utils.roundNumber(area || 0, 2);
  displayText.primary.push(`${roundedArea} ${getDisplayUnit(areaUnit)}`);

  // Todo: we need a better UI for displaying all these information
  mappedAnnotations.forEach(mappedAnnotation => {
    const { unit, max, SeriesNumber } = mappedAnnotation;

    if (Number.isFinite(max)) {
      const maxStr = getStatisticDisplayString(max, unit, 'max');

      displayText.primary.push(maxStr);
    }
    displayText.secondary.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  });

  return displayText;
}

export default RectangleROI;
