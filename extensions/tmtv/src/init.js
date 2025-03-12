import {
  addTool,
  RectangleROIStartEndThresholdTool,
  CircleROIStartEndThresholdTool,
} from '@cornerstonejs/tools';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';

import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

const { CORNERSTONE_3D_TOOLS_SOURCE_NAME, CORNERSTONE_3D_TOOLS_SOURCE_VERSION } = CSExtensionEnums;

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager }) {
  const { measurementService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  addTool(RectangleROIStartEndThresholdTool);
  addTool(CircleROIStartEndThresholdTool);

  const { RectangleROIStartEndThreshold, CircleROIStartEndThreshold } =
    measurementServiceMappingsFactory(
      measurementService,
      displaySetService,
      cornerstoneViewportService
    );

  const csTools3DVer1MeasurementSource = measurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'RectangleROIStartEndThreshold',
    RectangleROIStartEndThreshold.matchingCriteria,
    RectangleROIStartEndThreshold.toAnnotation,
    RectangleROIStartEndThreshold.toMeasurement
  );

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'CircleROIStartEndThreshold',
    CircleROIStartEndThreshold.matchingCriteria,
    CircleROIStartEndThreshold.toAnnotation,
    CircleROIStartEndThreshold.toMeasurement
  );
}
