import RectangleROIStartEndThreshold from './RectangleROIStartEndThreshold';
import CircleROIStartEndThreshold from './CircleROIStartEndThreshold';

const measurementServiceMappingsFactory = (
  measurementService,
  displaySetService,
  cornerstoneViewportService
) => {
  return {
    RectangleROIStartEndThreshold: {
      toAnnotation: RectangleROIStartEndThreshold.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        RectangleROIStartEndThreshold.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService
        ),
      matchingCriteria: [
        {
          valueType: measurementService.VALUE_TYPES.ROI_THRESHOLD_MANUAL,
        },
      ],
    },
    CircleROIStartEndThreshold: {
      toAnnotation: CircleROIStartEndThreshold.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        CircleROIStartEndThreshold.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService
        ),
      matchingCriteria: [
        {
          valueType: measurementService.VALUE_TYPES.ROI_THRESHOLD_MANUAL,
        },
      ],
    },
  };
};

export default measurementServiceMappingsFactory;
