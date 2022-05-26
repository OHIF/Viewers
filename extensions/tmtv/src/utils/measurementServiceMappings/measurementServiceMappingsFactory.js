import RectangleRoiStartEndThreshold from './RectangleRoiStartEndThreshold';

const measurementServiceMappingsFactory = (
  MeasurementService,
  DisplaySetService,
  ViewportService
) => {
  /**
   * Maps measurement service format object to cornerstone annotation object.
   *
   * @param {Measurement} measurement The measurement instance
   * @param {string} definition The source definition
   * @return {Object} Cornerstone annotation data
   */

  const _getValueTypeFromToolType = toolType => {
    const { SUV_PEAK } = MeasurementService.VALUE_TYPES;

    // TODO -> I get why this was attemped, but its not nearly flexible enough.
    // A single measurement may have an ellipse + a bidirectional measurement, for instances.
    // You can't define a bidirectional tool as a single type..
    const TOOL_TYPE_TO_VALUE_TYPE = {
      ptSUVPeak: SUV_PEAK,
    };

    return TOOL_TYPE_TO_VALUE_TYPE[toolType];
  };

  return {
    RectangleRoiStartEndThreshold: {
      toAnnotation: RectangleRoiStartEndThreshold.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        RectangleRoiStartEndThreshold.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          ViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ROI_THRESHOLD_MANUAL,
        },
      ],
    },
  };
};

export default measurementServiceMappingsFactory;
