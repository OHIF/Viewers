export default function getToolStateToCornerstoneMeasurementSchema(
  toolType,
  MeasurementService,
  DisplaySetService,
  imageId
) {
  const _getValueTypeFromToolType = toolType => {
    const {
      POLYLINE,
      ELLIPSE,
      POINT,
      BIDIRECTIONAL,
    } = MeasurementService.VALUE_TYPES;

    // TODO -> I get why this was attemped, but its not nearly flexible enough.
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
          imageId,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    case 'Bidirectional':
      return measurementData =>
        Bidirectional(
          measurementData,
          imageId,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    case 'EllipticalRoi':
      return measurementData =>
        EllipticalRoi(
          measurementData,
          imageId,
          DisplaySetService,
          _getValueTypeFromToolType
        );
    case 'ArrowAnnotate':
      return measurementData =>
        ArrowAnnotate(
          measurementData,
          imageId,
          DisplaySetService,
          _getValueTypeFromToolType
        );
  }
}

function Length(
  measurementData,
  imageId,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;
  const instance = cornerstone.metaData.get('instance', imageId);
  const {
    SOPInstanceUID,
    FrameOfReferenceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
  } = instance;

  const displaySetInstanceUID = _getDisplaySetInstanceUID(
    DisplaySetService,
    SeriesInstanceUID,
    SOPInstanceUID
  );

  const { handles, label } = measurementData;

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
    description: measurementData.description,
    unit: measurementData.unit,
    length: measurementData.length,
    type: _getValueTypeFromToolType(tool),
    points,
    label,
  };
}

function Bidirectional(
  measurementData,
  imageId,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;
  const instance = cornerstone.metaData.get('instance', imageId);
  const {
    SOPInstanceUID,
    FrameOfReferenceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
  } = instance;
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
  imageId,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;
  const instance = cornerstone.metaData.get('instance', imageId);
  const {
    SOPInstanceUID,
    FrameOfReferenceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
  } = instance;

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
  imageId,
  DisplaySetService,
  _getValueTypeFromToolType
) {
  const tool = measurementData.toolType || measurementData.toolName;
  const instance = cornerstone.metaData.get('instance', imageId);
  const {
    SOPInstanceUID,
    FrameOfReferenceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
  } = instance;

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
