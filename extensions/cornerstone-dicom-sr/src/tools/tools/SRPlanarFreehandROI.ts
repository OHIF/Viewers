import { PlanarFreehandROITool } from '@cornerstonejs/tools';

/**
 * The reason we are extending PlanarFreehandROITool is to create a new tool for SR
 * viewport which basically has a different name. This is done since Cornerstone
 * has shifted from creating tool instances for each annotation, and we have PlanarFreehandROI
 * mappers at the MeasurementService, so if we didn't do this, we would be mapping
 * the SR annotation to the MeasurementService (since there is a PlanarFreehandROITool mapper),
 * but with extending and renaming it, there is not mapper for SRPlanarFreehandROITool; hence
 * no mapping; hence no new measurement, just temporary ones for the SR viewport.
 */
class SRPlanarFreehandROI extends PlanarFreehandROITool {
  static toolName = 'SRPlanarFreehandROI';
}

export default SRPlanarFreehandROI;
