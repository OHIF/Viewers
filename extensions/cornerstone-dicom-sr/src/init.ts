import {
  AngleTool,
  annotation,
  ArrowAnnotateTool,
  BidirectionalTool,
  CobbAngleTool,
  EllipticalROITool,
  CircleROITool,
  LengthTool,
  PlanarFreehandROITool,
  RectangleROITool,
} from '@cornerstonejs/tools';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import addToolInstance from './utils/addToolInstance';
import { Types } from '@ohif/core';
import toolNames from './tools/toolNames';

/**
 * @param {object} configuration
 */
export default function init({ configuration = {} }: Types.Extensions.ExtensionParams): void {
  addToolInstance(toolNames.DICOMSRDisplay, DICOMSRDisplayTool);
  addToolInstance(toolNames.SRLength, LengthTool);
  addToolInstance(toolNames.SRBidirectional, BidirectionalTool);
  addToolInstance(toolNames.SREllipticalROI, EllipticalROITool);
  addToolInstance(toolNames.SRCircleROI, CircleROITool);
  addToolInstance(toolNames.SRArrowAnnotate, ArrowAnnotateTool);
  addToolInstance(toolNames.SRAngle, AngleTool);
  addToolInstance(toolNames.SRPlanarFreehandROI, PlanarFreehandROITool);
  addToolInstance(toolNames.SRRectangleROI, RectangleROITool);

  // TODO - fix the SR display of Cobb Angle, as it joins the two lines
  addToolInstance(toolNames.SRCobbAngle, CobbAngleTool);

  // Modify annotation tools to use dashed lines on SR
  const dashedLine = {
    lineDash: '4,4',
  };
  annotation.config.style.setToolGroupToolStyles('SRToolGroup', {
    [toolNames.DICOMSRDisplay]: dashedLine,
    SRLength: dashedLine,
    SRBidirectional: dashedLine,
    SREllipticalROI: dashedLine,
    SRCircleROI: dashedLine,
    SRArrowAnnotate: dashedLine,
    SRCobbAngle: dashedLine,
    SRAngle: dashedLine,
    SRPlanarFreehandROI: dashedLine,
    SRRectangleROI: dashedLine,
    global: {},
  });
}
