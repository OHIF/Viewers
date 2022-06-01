import RectangleROIStartEndThreshold from './RectangleROIStartEndThreshold';

const measurementServiceMappingsFactory = (
  MeasurementService,
  DisplaySetService,
  Cornerstone3DViewportService
) => {
  return {
    RectangleROIStartEndThreshold: {
      toAnnotation: RectangleROIStartEndThreshold.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        RectangleROIStartEndThreshold.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          Cornerstone3DViewportService
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
