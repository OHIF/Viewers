import { measurements } from '@ohif/core';
const { getImageAttributes } = measurements;

const SUPPORTED_TOOLS = [
  'Length',
  'EllipticalRoi',
  'RectangleRoi',
  'ArrowAnnotate',
];

const measurementServiceMappingsFactory = measurementService => {
  /**
   * Maps measurement service format object to cornerstone annotation object.
   *
   * @param {Measurement} measurement The measurement instance
   * @param {string} definition The source definition
   * @return {Object} Cornerstone annotation data
   */
  const toAnnotation = (measurement, definition) => {
    const {
      id,
      label,
      description,
      points,
      unit,
      sopInstanceUID,
      frameOfReferenceUID,
      referenceSeriesUID,
      studyInstanceUID,
      frameNumber,
    } = measurement;

    return {
      toolName: definition,
      measurementData: {
        toolType: definition,
        studyInstanceUid: studyInstanceUID,
        frameIndex: frameNumber,
        sopInstanceUid: sopInstanceUID,
        frameOfReferenceUid: frameOfReferenceUID,
        seriesInstanceUid: referenceSeriesUID,
        unit,
        text: label,
        description,
        handles: _getHandlesFromPoints(points),
        _measurementServiceId: id,
      },
    };
  };

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  const toMeasurement = csToolsAnnotation => {
    const { element, measurementData } = csToolsAnnotation;

    const tool =
      csToolsAnnotation.toolType ||
      csToolsAnnotation.toolName ||
      measurementData.toolType;

    const validToolType = toolName => SUPPORTED_TOOLS.includes(toolName);

    if (!validToolType(tool)) {
      throw new Error('Tool not supported');
    }

    /*
     * TODO: These attributes will be added later after cstools events were fired.
     * This is why we also get them here.
     */
    const {
      sopInstanceUid,
      frameOfReferenceUid,
      seriesInstanceUid,
      studyInstanceUid,
      frameIndex,
    } = getImageAttributes(element);

    const points = [];
    points.push(measurementData.handles);

    return {
      id: measurementData._measurementServiceId,
      studyInstanceUID: studyInstanceUid,
      frameNumber: frameIndex,
      sopInstanceUID: sopInstanceUid,
      frameOfReferenceUID: frameOfReferenceUid,
      referenceSeriesUID: seriesInstanceUid,
      label: measurementData.text,
      description: measurementData.description,
      unit: measurementData.unit,
      /* TODO: Add concept names instead (descriptor) */
      area: measurementData.cachedStats && measurementData.cachedStats.area,
      type: _getValueTypeFromToolType(tool),
      points: _getPointsFromHandles(measurementData.handles),
    };
  };

  const _getValueTypeFromToolType = toolType => {
    const { POLYLINE, ELLIPSE, POINT } = measurementService.VALUE_TYPES;

    /* TODO: Relocate static value types */
    const TOOL_TYPE_TO_VALUE_TYPE = {
      Length: POLYLINE,
      EllipticalRoi: ELLIPSE,
      RectangleRoi: POLYLINE,
      ArrowAnnotate: POINT,
    };

    return TOOL_TYPE_TO_VALUE_TYPE[toolType];
  };

  const _getPointsFromHandles = handles => {
    let points = [];
    Object.keys(handles).map(handle => {
      if (['start', 'end'].includes(handle)) {
        let point = {};
        if (handles[handle].x) point.x = handles[handle].x;
        if (handles[handle].y) point.y = handles[handle].y;
        points.push(point);
      }
    });
    return points;
  };

  const _getHandlesFromPoints = points => {
    return points
      .map((p, i) => (i % 10 === 0 ? { start: p } : { end: p }))
      .reduce((obj, item) => Object.assign(obj, { ...item }), {});
  };

  return {
    toAnnotation,
    toMeasurement,
  };
};

export default measurementServiceMappingsFactory;
