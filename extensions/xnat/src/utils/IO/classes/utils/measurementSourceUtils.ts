import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';

// Helper to safely get source that has mappings already registered (Cornerstone3DTools).
export function getMeasurementSource(measurementService) {
  const {
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION,
  } = CSExtensionEnums;

  const source = measurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  if (!source) {
    throw new Error('Measurement source for Cornerstone3DTools not found – import aborted');
  }
  return source;
} 