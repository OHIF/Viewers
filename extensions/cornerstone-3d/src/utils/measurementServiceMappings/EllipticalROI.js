import { annotation } from '@cornerstonejs/tools';

import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import getModalityUnit from './utils/getModalityUnit';
import { utils } from '@ohif/core';

const EllipticalROI = {
  // Currently we only update the labels
  toAnnotation: measurement => {
    const annotationUID = measurement.uid;
    const cornerstone3DAnnotation = annotation.state.getAnnotation(
      annotationUID
    );

    if (!cornerstone3DAnnotation) {
      return;
    }

    if (cornerstone3DAnnotation.data.label !== measurement.label) {
      cornerstone3DAnnotation.data.label = measurement.label;
    }
  },
  toMeasurement: (
    csToolsEventDetail,
    DisplaySetService,
    Cornerstone3DViewportService,
    getValueTypeFromToolType
  ) => {
    const { annotation, viewportId } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('Length tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType) {
      throw new Error('Tool not supported');
    }

    const {
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = getSOPInstanceAttributes(
      referencedImageId,
      Cornerstone3DViewportService,
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

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(
      annotation,
      DisplaySetService
    );

    const displayText = getDisplayText(mappedAnnotations);
    const getReport = () =>
      _getReport(mappedAnnotations, points, FrameOfReferenceUID);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: metadata.label,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport,
    };
  },
};

function getMappedAnnotations(annotation, DisplaySetService) {
  const { metadata, data } = annotation;
  const { cachedStats } = data;
  const { referencedImageId, referencedSeriesInstanceUID } = metadata;
  const targets = Object.keys(cachedStats);

  if (!targets.length) {
    return;
  }

  const annotations = [];
  Object.keys(cachedStats).forEach(targetId => {
    const targetStats = cachedStats[targetId];

    let displaySet;

    if (targetId.startsWith('imageId:')) {
      const { SOPInstanceUID, SeriesInstanceUID } = getSOPInstanceAttributes(
        referencedImageId
      );

      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      // Todo: separate imageId and volumeId, for now just implementing the
      // referenceImageId
      throw new Error('Not implemented');
    }

    const { SeriesNumber, SeriesInstanceUID } = displaySet;
    const { mean, stdDev, max, area, Modality } = targetStats;
    const unit = getModalityUnit(Modality);

    annotations.push({
      SeriesInstanceUID,
      SeriesNumber,
      Modality,
      unit,
      mean,
      stdDev,
      max,
      area,
    });
  });

  return annotations;
}

/*
This function is used to convert the measurement data to a format that is
suitable for the report generation (e.g. for the csv report). The report
returns a list of columns and corresponding values.
*/
function _getReport(mappedAnnotations, points, FrameOfReferenceUID) {
  const columns = [];
  const values = [];

  // Add Type
  columns.push('AnnotationType');
  values.push('Cornerstone3D:EllipticalROI');

  mappedAnnotations.forEach(annotation => {
    const { mean, stdDev, max, area, unit } = annotation;

    if (!mean || !unit || !max || !area) {
      return;
    }

    columns.push(
      `max (${unit})`,
      `mean (${unit})`,
      `std (${unit})`,
      `area (mm2)`
    );
    values.push(max, mean, stdDev, area);
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

function getDisplayText(mappedAnnotations) {
  if (!mappedAnnotations || !mappedAnnotations.length) {
    return '';
  }

  const displayText = [];

  // Area is the same for all series
  const { area } = mappedAnnotations[0];
  const roundedArea = utils.roundNumber(area, 2);
  displayText.push(`Area: ${roundedArea} mm<sup>2</sup>`);

  mappedAnnotations.forEach(mappedAnnotation => {
    const { mean, unit, max, SeriesNumber } = mappedAnnotation;
    const roundedMean = utils.roundNumber(mean, 2);
    const roundedMax = utils.roundNumber(max, 2);
    // const roundedStdDev = utils.roundNumber(stdDev, 2);

    displayText.push(
      `S:${SeriesNumber} - max: ${roundedMax} <small>${unit}</small>`
    );
    displayText.push(
      `S:${SeriesNumber} - mean: ${roundedMean} <small>${unit}</small>`
    );
  });

  return displayText;
}

export default EllipticalROI;
