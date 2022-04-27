import { utils } from '@ohif/core';
import * as cornerstone3D from '@cornerstonejs/core';

export default function getCornerstoneToolStateToMeasurementSchema(
  toolType,
  MeasurementService,
  DisplaySetService,
  SOPInstanceUID,
  FrameOfReferenceUID,
  SeriesInstanceUID,
  StudyInstanceUID
) {
  const _getValueTypeFromToolType = toolType => {
    const {
      POLYLINE,
      ELLIPSE,
      POINT,
      BIDIRECTIONAL,
    } = MeasurementService.VALUE_TYPES;

    // TODO -> I get why this was attempted, but its not nearly flexible enough.
    // A single measurement may have an ellipse + a bidirectional measurement, for instances.
    // You can't define a bidirectional tool as a single type..
    // OHIF-230
    const TOOL_TYPE_TO_VALUE_TYPE = {
      Length: POLYLINE,
      EllipticalRoi: ELLIPSE,
      Bidirectional: BIDIRECTIONAL,
      ArrowAnnotate: POINT,
    };

    return TOOL_TYPE_TO_VALUE_TYPE[toolType];
  };

  switch (toolType) {
    case 'Length':
      return measurementData =>
        Length(
          measurementData,
          SOPInstanceUID,
          FrameOfReferenceUID,
          SeriesInstanceUID,
          StudyInstanceUID,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    case 'Bidirectional':
      return measurementData =>
        Bidirectional(
          measurementData,
          SOPInstanceUID,
          FrameOfReferenceUID,
          SeriesInstanceUID,
          StudyInstanceUID,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    case 'EllipticalRoi':
      return measurementData =>
        EllipticalRoi(
          measurementData,
          SOPInstanceUID,
          FrameOfReferenceUID,
          SeriesInstanceUID,
          StudyInstanceUID,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    case 'ArrowAnnotate':
      return measurementData =>
        ArrowAnnotate(
          measurementData,
          SOPInstanceUID,
          FrameOfReferenceUID,
          SeriesInstanceUID,
          StudyInstanceUID,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    default:
      throw new Error(`Unknown toolType: ${toolType}`);
  }
}

// The following logic is somehow reused from the cornerstone3D extension
// which has mappers for length to measurements. Similar to annotationToMeasurement
// and measurementToAnnotation mappings, we should be able to register a
// rawMeasurementToMeasurement function and use it instead of the following logic.
function Length(
  measurementData,
  SOPInstanceUID,
  FrameOfReferenceUID,
  SeriesInstanceUID,
  StudyInstanceUID,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;

  let displaySet;

  if (SOPInstanceUID) {
    displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
      SOPInstanceUID,
      SeriesInstanceUID
    );
  } else {
    displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
  }

  const { points } = measurementData.data.handles;

  const mappedAnnotations = getMappedAnnotations(
    measurementData,
    DisplaySetService
  );

  const displayText = getDisplayText(mappedAnnotations);
  const getReport = () =>
    _getReport(mappedAnnotations, points, FrameOfReferenceUID);

  return {
    uid: measurementData.uid,
    SOPInstanceUID,
    FrameOfReferenceUID,
    points,
    referenceSeriesUID: SeriesInstanceUID,
    referenceStudyUID: StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    label: measurementData.label,
    displayText: displayText,
    toolName: tool,
    data: measurementData.data.cachedStats,
    type: _getValueTypeFromToolType(tool),
    getReport,
  };
}

function getMappedAnnotations(annotation, DisplaySetService) {
  const { data } = annotation;
  const { cachedStats } = data;
  const targets = Object.keys(cachedStats);

  if (!targets.length) {
    return;
  }

  const annotations = [];
  Object.keys(cachedStats).forEach(targetId => {
    const targetStats = cachedStats[targetId];

    let displaySet;

    if (targetId.startsWith('imageId:')) {
      const referencedImageId = targetId.replace('imageId:', '');
      const { SOPInstanceUID, SeriesInstanceUID } = cornerstone3D.metaData.get(
        'instance',
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
    const { length } = targetStats;
    const unit = 'mm';

    annotations.push({
      SeriesInstanceUID,
      SeriesNumber,
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
  values.push('Cornerstone3D:Length');

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

function getDisplayText(mappedAnnotations) {
  if (!mappedAnnotations || !mappedAnnotations.length) {
    return '';
  }

  const displayText = [];

  // Area is the same for all series
  const { length, SeriesNumber } = mappedAnnotations[0];
  const roundedLength = utils.roundNumber(length, 2);
  displayText.push(`${roundedLength} mm (S: ${SeriesNumber})`);

  return displayText;
}

function Bidirectional(
  measurementData,
  SOPInstanceUID,
  FrameOfReferenceUID,
  SeriesInstanceUID,
  StudyInstanceUID,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;

  const displaySetInstanceUID = _getDisplaySetInstanceUID(
    DisplaySetService,
    SeriesInstanceUID,
    SOPInstanceUID
  );

  const { handles, label } = measurementData;

  const longAxis = [handles.start, handles.end];
  const shortAxis = [handles.perpendicularStart, handles.perpendicularEnd];

  return {
    id: measurementData.id,
    SOPInstanceUID: SOPInstanceUID,
    FrameOfReferenceUID,
    referenceSeriesUID: SeriesInstanceUID,
    referenceStudyUID: StudyInstanceUID,
    displaySetInstanceUID,
    description: measurementData.description,
    unit: measurementData.unit,
    shortestDiameter: measurementData.shortestDiameter,
    longestDiameter: measurementData.longestDiameter,
    type: _getValueTypeFromToolType(tool),
    points: { longAxis, shortAxis },
    label,
  };
}

function EllipticalRoi(
  measurementData,
  SOPInstanceUID,
  FrameOfReferenceUID,
  SeriesInstanceUID,
  StudyInstanceUID,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;

  const displaySetInstanceUID = _getDisplaySetInstanceUID(
    DisplaySetService,
    SeriesInstanceUID,
    SOPInstanceUID
  );
  const { handles, label } = measurementData;
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

  return {
    id: measurementData.id,
    SOPInstanceUID: SOPInstanceUID,
    FrameOfReferenceUID,
    referenceSeriesUID: SeriesInstanceUID,
    referenceStudyUID: StudyInstanceUID,
    displaySetInstanceUID,
    description: measurementData.description,
    unit: measurementData.unit,
    area:
      measurementData.cachedStats &&
      measurementData.cachedStats
        .area /* TODO: Add concept names instead (descriptor) */,
    type: _getValueTypeFromToolType(tool),
    points,
    label,
  };
}

function ArrowAnnotate(
  measurementData,
  SOPInstanceUID,
  FrameOfReferenceUID,
  SeriesInstanceUID,
  StudyInstanceUID,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;

  const displaySetInstanceUID = _getDisplaySetInstanceUID(
    DisplaySetService,
    SeriesInstanceUID,
    SOPInstanceUID
  );

  const { handles } = measurementData;

  const points = [];
  Object.keys(handles).map(handle => {
    if (['start', 'end'].includes(handle)) {
      let point = {};
      if (handles[handle].x) point.x = handles[handle].x;
      if (handles[handle].y) point.y = handles[handle].y;
      points.push(point);
    }
  });

  return {
    id: measurementData.id,
    SOPInstanceUID: SOPInstanceUID,
    FrameOfReferenceUID,
    referenceSeriesUID: SeriesInstanceUID,
    referenceStudyUID: StudyInstanceUID,
    displaySetInstanceUID,
    label: measurementData.text,
    description: measurementData.description,
    unit: measurementData.unit,
    text: measurementData.text,
    type: _getValueTypeFromToolType(tool),
    points,
  };
}

function _getDisplaySetInstanceUID(
  DisplaySetService,
  SeriesInstanceUID,
  SOPInstanceUID
) {
  const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
    SOPInstanceUID,
    SeriesInstanceUID
  );

  return displaySet.displaySetInstanceUID;
}
