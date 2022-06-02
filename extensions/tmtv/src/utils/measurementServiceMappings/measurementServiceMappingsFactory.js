import RectangleROIStartEndThreshold from './RectangleROIStartEndThreshold';

const measurementServiceMappingsFactory = (
  MeasurementService,
  DisplaySetService,
  CornerstoneViewportService
) => {
  return {
    RectangleROIStartEndThreshold: {
      toAnnotation: RectangleROIStartEndThreshold.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        RectangleROIStartEndThreshold.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          CornerstoneViewportService
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
