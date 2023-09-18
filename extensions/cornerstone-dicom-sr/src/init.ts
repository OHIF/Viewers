import {
  addTool,
  AngleTool,
  annotation,
  ArrowAnnotateTool,
  BidirectionalTool,
  CobbAngleTool,
  EllipticalROITool,
  CircleROITool,
  LengthTool,
  PlanarFreehandROITool,
} from '@cornerstonejs/tools';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import addToolInstance from './utils/addToolInstance';
import { Types } from '@ohif/core';
import toolNames from './tools/toolNames';

/**
 * @param {object} configuration
 */
export default function init({ configuration = {} }: Types.Extensions.ExtensionParams): void {
  addTool(DICOMSRDisplayTool);
  addToolInstance(toolNames.SRLength, LengthTool, {});
  addToolInstance(toolNames.SRBidirectional, BidirectionalTool);
  addToolInstance(toolNames.SREllipticalROI, EllipticalROITool);
  addToolInstance(toolNames.SRCircleROI, CircleROITool);
  addToolInstance(toolNames.SRArrowAnnotate, ArrowAnnotateTool);
  addToolInstance(toolNames.SRAngle, AngleTool);
  // TODO - fix the SR display of Cobb Angle, as it joins the two lines
  addToolInstance(toolNames.SRCobbAngle, CobbAngleTool);
  // TODO - fix the rehydration of Freehand, as it throws an exception
  // on a missing polyline. The fix is probably in CS3D
  addToolInstance(toolNames.SRPlanarFreehandROI, PlanarFreehandROITool);

  // Modify annotation tools to use dashed lines on SR
  const dashedLine = {
    lineDash: '4,4',
  };
  annotation.config.style.setToolGroupToolStyles('SRToolGroup', {
    SRLength: dashedLine,
    SRBidirectional: dashedLine,
    SREllipticalROI: dashedLine,
    SRCircleROI: dashedLine,
    SRArrowAnnotate: dashedLine,
    SRCobbAngle: dashedLine,
    SRAngle: dashedLine,
    SRPlanarFreehandROI: dashedLine,
    global: {},
  });
}
