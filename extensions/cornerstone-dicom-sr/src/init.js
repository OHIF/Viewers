import { addTool, annotation } from '@cornerstonejs/tools';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import SRLengthTool from './tools/tools/SRLength';
import SRBidirectionalTool from './tools/tools/SRBidirectional';
import SREllipticalROITool from './tools/tools/SREllipticalROI';
import SRArrowAnnotateTool from './tools/tools/SRArrowAnnotate';
import SRPlanarFreehandROITool from './tools/tools/SRPlanarFreehandROI';

/**
 * @param {object} configuration
 */
export default function init({ configuration = {} }) {
  addTool(DICOMSRDisplayTool);
  addTool(SRLengthTool);
  addTool(SRBidirectionalTool);
  addTool(SREllipticalROITool);
  addTool(SRArrowAnnotateTool);
  addTool(SRPlanarFreehandROITool);

  // Modify annotation tools to use dashed lines on SR
  const dashedLine = {
    lineDash: '4,4',
  };
  annotation.config.style.setToolGroupToolStyles('SRToolGroup', {
    [SRLengthTool.toolName]: dashedLine,
    [SRBidirectionalTool.toolName]: dashedLine,
    [SREllipticalROITool.toolName]: dashedLine,
    [SRArrowAnnotateTool.toolName]: dashedLine,
    [SRPlanarFreehandROITool.toolName]: dashedLine,
    global: {},
  });
}
