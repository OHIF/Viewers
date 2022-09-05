import DICOMSRDisplayTool from './DICOMSRDisplayTool';
import SRLengthTool from './tools/SRLength';
import SRBidirectional from './tools/SRBidirectional';
import SREllipticalROI from './tools/SREllipticalROI';
import SRArrowAnnotate from './tools/SRArrowAnnotate';
import SRPlanarFreehandROI from './tools/SRPlanarFreehandROI';

const toolNames = {
  DICOMSRDisplay: DICOMSRDisplayTool.toolName,
  SRLength: SRLengthTool.toolName,
  SRBidirectional: SRBidirectional.toolName,
  SREllipticalROI: SREllipticalROI.toolName,
  SRArrowAnnotate: SRArrowAnnotate.toolName,
  SRPlanarFreehandROI: SRPlanarFreehandROI.toolName,
};

export default toolNames;
