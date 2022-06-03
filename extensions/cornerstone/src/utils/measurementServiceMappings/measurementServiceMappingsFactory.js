import Length from './Length';
import Bidirectional from './Bidirectional';
import ArrowAnnotate from './ArrowAnnotate';
import EllipticalRoi from './EllipticalRoi';
import NLFreehandRoi from './NLFreehandRoi';
import RectangleRoi from './RectangleRoi';
import Angle from './Angle';

const measurementServiceMappingsFactory = (
  MeasurementService,
  DisplaySetService
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
      POINT,
      BIDIRECTIONAL,
      FREEHAND,
      RECTANGLE,
      ANGLE,
    } = MeasurementService.VALUE_TYPES;

    // TODO -> I get why this was attemped, but its not nearly flexible enough.
    // A single measurement may have an ellipse + a bidirectional measurement, for instances.
    // You can't define a bidirectional tool as a single type..
    const TOOL_TYPE_TO_VALUE_TYPE = {
      Length: POLYLINE,
      EllipticalRoi: ELLIPSE,
      Bidirectional: BIDIRECTIONAL,
      ArrowAnnotate: POINT,
      NLFreehandRoi: FREEHAND,
      RectangleRoi: RECTANGLE,
      Angle: ANGLE,
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
    ArrowAnnotate: {
      toAnnotation: ArrowAnnotate.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        ArrowAnnotate.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.POINT,
          points: 1,
        },
      ],
    },
    EllipticalRoi: {
      toAnnotation: EllipticalRoi.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        EllipticalRoi.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ELLIPSE,
        },
      ],
    },
    NLFreehandRoi: {
      toAnnotation: NLFreehandRoi.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        NLFreehandRoi.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.FREEHAND,
        },
      ],
    },
    RectangleRoi: {
      toAnnotation: RectangleRoi.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        RectangleRoi.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.RECTANGLE,
        },
      ],
    },
    Angle: {
      toAnnotation: Angle.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        Angle.toMeasurement(
          csToolsAnnotation,
          DisplaySetService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ANGLE,
        },
      ],
    },
  };
};

export default measurementServiceMappingsFactory;
