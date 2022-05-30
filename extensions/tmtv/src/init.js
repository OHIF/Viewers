import * as cornerstone3DTools from '@cornerstonejs/tools';

import measurementServiceMappingsFactory from './utils/measurementServiceMappings/measurementServiceMappingsFactory';

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';
/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration,
}) {
  const {
    MeasurementService,
    DisplaySetService,
    Cornerstone3DViewportService,
  } = servicesManager.services;

  const { RectangleROIStartEndThreshold } = measurementServiceMappingsFactory(
    MeasurementService,
    DisplaySetService,
    Cornerstone3DViewportService
  );

  // Todo: this needs to be run after cornerstone3D creates the namespace
  // for the measurement tools and all tools have been added to cornerstone3D
  const csTools3DVer1MeasurementSource = MeasurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  MeasurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'RectangleROIStartEndThreshold',
    RectangleROIStartEndThreshold.matchingCriteria,
    RectangleROIStartEndThreshold.toAnnotation,
    RectangleROIStartEndThreshold.toMeasurement
  );
}

function initCornerstone3DTools(configuration = {}) {
  cornerstone3DTools.addTool(
    cornerstone3DTools.RectangleROIStartEndThresholdTool
  );
}
