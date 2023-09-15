import { MeasurementService } from '@ohif/core';
import Length from './Length';
import Bidirectional from './Bidirectional';
import EllipticalROI from './EllipticalROI';
import CircleROI from './CircleROI';
import ArrowAnnotate from './ArrowAnnotate';
import CobbAngle from './CobbAngle';
import Angle from './Angle';
import PlanarFreehandROI from './PlanarFreehandROI';
import RectangleROI from './RectangleROI';

const measurementServiceMappingsFactory = (
  measurementService: MeasurementService,
  displaySetService,
  cornerstoneViewportService
) => {
  /**
   * Maps measurement service format object to cornerstone annotation object.
   *
   * @param measurement The measurement instance
   * @param definition The source definition
   * @return Cornerstone annotation data
   */

  const _getValueTypeFromToolType = toolType => {
    const { POLYLINE, ELLIPSE, CIRCLE, RECTANGLE, BIDIRECTIONAL, POINT, ANGLE } =
      MeasurementService.VALUE_TYPES;

    // TODO -> I get why this was attempted, but its not nearly flexible enough.
    // A single measurement may have an ellipse + a bidirectional measurement, for instances.
    // You can't define a bidirectional tool as a single type..
    const TOOL_TYPE_TO_VALUE_TYPE = {
      Length: POLYLINE,
      EllipticalROI: ELLIPSE,
      CircleROI: CIRCLE,
      RectangleROI: RECTANGLE,
      PlanarFreehandROI: POLYLINE,
      Bidirectional: BIDIRECTIONAL,
      ArrowAnnotate: POINT,
      CobbAngle: ANGLE,
      Angle: ANGLE,
    };

    return TOOL_TYPE_TO_VALUE_TYPE[toolType];
  };

  const factories = {
    Length: {
      toAnnotation: Length.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        Length.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
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
          displaySetService,
          cornerstoneViewportService,
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
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ELLIPSE,
        },
      ],
    },

    CircleROI: {
      toAnnotation: CircleROI.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        CircleROI.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.CIRCLE,
        },
      ],
    },

    RectangleROI: {
      toAnnotation: RectangleROI.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        RectangleROI.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.POLYLINE,
        },
      ],
    },

    PlanarFreehandROI: {
      toAnnotation: PlanarFreehandROI.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        PlanarFreehandROI.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.POLYLINE,
        },
      ],
    },

    ArrowAnnotate: {
      toAnnotation: ArrowAnnotate.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        ArrowAnnotate.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.POINT,
          points: 1,
        },
      ],
    },

    CobbAngle: {
      toAnnotation: CobbAngle.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        CobbAngle.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ANGLE,
        },
      ],
    },

    Angle: {
      toAnnotation: Angle.toAnnotation,
      toMeasurement: csToolsAnnotation =>
        Angle.toMeasurement(
          csToolsAnnotation,
          displaySetService,
          cornerstoneViewportService,
          _getValueTypeFromToolType
        ),
      matchingCriteria: [
        {
          valueType: MeasurementService.VALUE_TYPES.ANGLE,
        },
      ],
    },
  };

  return factories;
};

export default measurementServiceMappingsFactory;
