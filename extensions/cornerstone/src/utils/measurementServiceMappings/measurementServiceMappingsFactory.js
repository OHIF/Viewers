import Length from './Length';
import Bidirectional from './Bidirectional';
import EllipticalROI from './EllipticalROI';
import ArrowAnnotate from './ArrowAnnotate';

const measurementServiceMappingsFactory = (
  MeasurementService,
  DisplaySetService,
  CornerstoneViewportService
) => {
  /**
   * Maps measurement service format object to cornerstone annotation object.
   *
   * @param {Measurement} measurement The measurement instance
   * @param {string} definition The source definition
   * @return {Object} Cornerstone annotation data
   */

  const _getValueTypeFromToolType = toolType => {
    const {
      POLYLINE,
      ELLIPSE,
      RECTANGLE,
      BIDIRECTIONAL,
      POINT,
    } = MeasurementService.VALUE_TYPES;

    // TODO -> I get why this was attempted, but its not nearly flexible enough.
    // A single measurement may have an ellipse + a bidirectional measurement, for instances.
    // You can't define a bidirectional tool as a single type..
    const TOOL_TYPE_TO_VALUE_TYPE = {
      Length: POLYLINE,
      EllipticalROI: ELLIPSE,
      RectangleROI: RECTANGLE,
      Bidirectional: BIDIRECTIONAL,
      ArrowAnnotate: POINT,
    };

    return TOOL_TYPE_TO_VALUE_TYPE[toolType];
  };

  return {
    Length: {
      toAnnotation: Length.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        Length.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          CornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.POLYLINE,
          points: 2,
        },
      ],
    },
    Bidirectional: {
      toAnnotation: Bidirectional.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        Bidirectional.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          CornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        // TODO -> We should eventually do something like shortAxis + longAxis,
        // But its still a little unclear how these automatic interpretations will work.
        {
          valueType: MeasurementService.VALUE_TYPES.POLYLINE,
          points: 2,
        },
        {
          valueType: MeasurementService.VALUE_TYPES.POLYLINE,
          points: 2,
        },
      ],
    },
    EllipticalROI: {
      toAnnotation: EllipticalROI.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        EllipticalROI.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          CornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ELLIPSE,
        },
      ],
    },
    ArrowAnnotate: {
      toAnnotation: ArrowAnnotate.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        ArrowAnnotate.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          CornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.POINT,
          points: 1,
        },
      ],
    },
  };
};

export default measurementServiceMappingsFactory;
