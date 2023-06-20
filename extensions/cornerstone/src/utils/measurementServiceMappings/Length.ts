import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';

const displaySetByReferencedImageID = (
  referencedImageId,
  cornerstoneViewportService,
  displaySetService,
  viewportId
) => {
  const sopInstanceAttributes = getSOPInstanceAttributes(
    referencedImageId,
    cornerstoneViewportService,
    viewportId
  );
  const displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
    sopInstanceAttributes.SOPInstanceUID,
    sopInstanceAttributes.SeriesInstanceUID
  );

  return displaySet;
};

const displaySetByViewportID = (
  cornerstoneViewportService,
  displaySetService,
  viewportId
) => {
  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  const data = viewportInfo?.viewportData?.data?.[0];
  const displaySet = displaySetService.getDisplaySetByUID(
    data.displaySetInstanceUID
  );
  return displaySet;
};

const getDisplaySet = (
  referencedImageId,
  cornerstoneViewportService,
  displaySetService,
  viewportId
) => {
  if (referencedImageId) {
    return displaySetByReferencedImageID(
      referencedImageId,
      cornerstoneViewportService,
      displaySetService,
      viewportId
    );
  } else if (viewportId) {
    return displaySetByViewportID(
      cornerstoneViewportService,
      displaySetService,
      viewportId
    );
  } else {
    // no viewport ID or referenced image ID was passed so we can either
    // grab the only valid option or throw here try our luck and just grab the first active displayset
    const activeDisplaySets = displaySetService.getActiveDisplaySets();
    if (activeDisplaySets.length > 1) {
      throw new Error(
        'Found more than one active displayset in absence of referencedImageID and viewportID!'
      );
    }
    return activeDisplaySets[0];
  }
};

const Length = {
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
    cornerstoneViewportService,
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

    const displaySet = getDisplaySet(
      referencedImageId,
      cornerstoneViewportService,
      displaySetService,
      viewportId
    );

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(
      annotation,
      displaySetService,
      cornerstoneViewportService,
      viewportId
    );

    const displayText = getDisplayText(mappedAnnotations, displaySet);
    const getReport = () =>
      _getReport(mappedAnnotations, points, FrameOfReferenceUID);

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = displaySet;

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      frameNumber: mappedAnnotations[0]?.frameNumber || 1,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType(toolName),
      getReport,
    };
  },
};

function getMappedAnnotations(
  annotation,
  displaySetService,
  cornerstoneViewportService,
  viewportId
) {
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

    const sopInstanceAttributes = getSOPInstanceAttributes(referencedImageId);

    const displaySet = getDisplaySet(
      referencedImageId,
      cornerstoneViewportService,
      displaySetService,
      viewportId
    );

    const { length } = targetStats;
    const unit = 'mm';

    annotations.push({
      SeriesInstanceUID: displaySet.SeriesInstanceUID,
      SOPInstanceUID: sopInstanceAttributes?.SOPInstanceUID || undefined,
      SeriesNumber: displaySet.SeriesInstanceUID,
      frameNumber: sopInstanceAttributes?.frameNumber || 1,
      unit,
      length,
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
  values.push('Cornerstone:Length');

  mappedAnnotations.forEach(annotation => {
    const { length } = annotation;
    columns.push(`Length (mm)`);
    values.push(length);
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

function getDisplayText(mappedAnnotations, displaySet) {
  if (!mappedAnnotations || !mappedAnnotations.length) {
    return '';
  }

  const displayText = [];

  // Area is the same for all series
  const {
    length,
    SeriesNumber,
    SOPInstanceUID,
    frameNumber,
  } = mappedAnnotations[0];

  const instance = displaySet.images.find(
    image => image.SOPInstanceUID === SOPInstanceUID
  );

  let InstanceNumber;
  if (instance) {
    InstanceNumber = instance.InstanceNumber;
  }

  const instanceText = InstanceNumber ? ` I: ${InstanceNumber}` : '';
  const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';

  const roundedLength = utils.roundNumber(length, 2);
  displayText.push(
    `${roundedLength} mm (S: ${SeriesNumber}${instanceText}${frameText})`
  );

  return displayText;
}

export default Length;
