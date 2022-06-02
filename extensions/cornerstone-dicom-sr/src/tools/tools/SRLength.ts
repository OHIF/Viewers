import { LengthTool } from '@cornerstonejs/tools';

/**
 * The reason we are extending LengthTool is to create a new tool for SR
 * viewport which basically has a different name. This is done since Cornerstone
 * has shifted from creating tool instances for each annotation, and we have Length
 * mappers at the MeasurementService, so if we didn't do this, we would be mapping
 * the SR annotation to the MeasurementService (since there is a LengthTool mapper),
 * but with extending and renaming it, there is not mapper for SRLengthTool; hence
 * no mapping; hence no new measurement, just temporary ones for the SR viewport.
 */
class SRLengthTool extends LengthTool {
  static toolName = 'SRLength';
}

export default SRLengthTool;
