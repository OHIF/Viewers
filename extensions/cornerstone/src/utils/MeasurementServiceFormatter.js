import cornerstone from 'cornerstone-core';

const SUPPORTED_TOOLS = ['Length', 'EllipticalRoi', 'RectangleRoi', 'ArrowAnnotate'];

/**
 * Measurement schema
 *
 * @typedef {Object} MeasurementSchema
 * @property {number} id -
 * @property {string} sopInstanceUID -
 * @property {string} frameOfReferenceUID -
 * @property {string} referenceSeriesUID -
 * @property {string} label -
 * @property {string} description -
 * @property {string} type -
 * @property {string} unit -
 * @property {number} area -
 * @property {Array} points -
 * @property {string} source -
 * @property {string} sourceToolType -
 */

class MeasurementServiceFormatter {
  constructor(measurementService) {
    this.measurementService = measurementService;
  }

  /**
   * Maps measurement service format object to cornerstone annotation object.
   *
   * @param {MeasurementSchema} measurement
   * @return {Object} cornerstone annotation data
   */
  toAnnotation({
    id,
    source,
    sourceToolType,
    label,
    description,
    type,
    points,
    unit,
    sopInstanceUID,
    frameOfReferenceUID,
    referenceSeriesUID,
  }) {
    return new Promise((resolve, reject) => {
      let toolType = sourceToolType;

      if (!toolType) {
        switch (type) {
          case this.measurementService.constructor.VALUE_TYPES.POLYLINE:
            if (points.length === 2) toolType = 'Length';
            break;
          case this.measurementService.constructor.VALUE_TYPES.POINT:
            if (label) toolType = 'ArrowAnnotate';
            break;
          default:
            break;
        }
      }

      return resolve({
        toolName: toolType,
        measurementData: {
          sopInstanceUid: sopInstanceUID,
          frameOfReferenceUid: frameOfReferenceUID,
          seriesInstanceUid: referenceSeriesUID,
          unit,
          text: label,
          description,
          handles: this._getHandlesFromPoints(points),
          _measurementServiceId: id,
        },
      });
    });
  }

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone event data
   * @return {MeasurementSchema} measurement
   */
  toMeasurement(eventData) {
    return new Promise((resolve, reject) => {
      const { toolName, element, measurementData } = eventData;

      const validToolType = toolName => SUPPORTED_TOOLS.includes(toolName);

      if (!validToolType(toolName)) {
        return reject('Invalid tool type');
      }

      const {
        sopInstanceUid,
        frameOfReferenceUid,
        seriesInstanceUid,
      } = this._getAttributes(element);

      const points = [];
      points.push(measurementData.handles);

      return resolve({
        sopInstanceUID: sopInstanceUid,
        frameOfReferenceUID: frameOfReferenceUid,
        referenceSeriesUID: seriesInstanceUid,
        label: measurementData.text,
        description: measurementData.description,
        unit: measurementData.unit,
        area: measurementData.cachedStats && measurementData.cachedStats.area, /* TODO: Add concept names instead (descriptor) */
        type: this._getValueTypeFromToolType(toolName),
        points: this._getPointsFromHandles(measurementData.handles),
        source: 'CornerstoneTools', /* TODO: multiple vendors */
        sourceToolType: toolName,
      });
    });
  }

  _getAttributes(element) {
    const enabledElement = cornerstone.getEnabledElement(element);
    const imageId = enabledElement.image.imageId;
    const sopInstance = cornerstone.metaData.get('instance', imageId);
    const sopInstanceUid = sopInstance.sopInstanceUid;
    const frameOfReferenceUid = sopInstance.frameOfReferenceUID;
    const series = cornerstone.metaData.get('series', imageId);
    const seriesInstanceUid = series.seriesInstanceUid;

    return { sopInstanceUid, frameOfReferenceUid, seriesInstanceUid };
  }

  _getValueTypeFromToolType(toolType) {
    const {
      POLYLINE,
      ELLIPSE,
      POINT,
    } = this.measurementService.constructor.VALUE_TYPES;

    /* TODO: Relocate static value types */
    const TOOL_TYPE_TO_VALUE_TYPE = {
      Length: POLYLINE,
      EllipticalRoi: ELLIPSE,
      RectangleRoi: POLYLINE,
      ArrowAnnotate: POINT,
    };

    return TOOL_TYPE_TO_VALUE_TYPE[toolType];
  }

  _getPointsFromHandles(handles) {
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
  }

  _getHandlesFromPoints(points) {
    return points
      .map((p, i) => (i % 10 === 0 ? { start: p } : { end: p }))
      .reduce((obj, item) => Object.assign(obj, { ...item }), {});
  }
}

export default MeasurementServiceFormatter;
