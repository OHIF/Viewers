import { addTool, RectangleROIStartEndThresholdTool } from '@cornerstonejs/tools';

import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';
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

  const { RectangleROIStartEndThreshold } = measurementServiceMappingsFactory(
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
}
