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
  RectangleROITool,
} from '@cornerstonejs/tools';
import { Types } from '@ohif/core';

import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import addToolInstance from './utils/addToolInstance';
import toolNames from './tools/toolNames';
import SRPointTool from './tools/SRPointTool';
import { getSRRectangleROITextLines } from './utils/srToolGetTextLines';

/**
 * @param {object} configuration
 */
export default function init({
  configuration = {},
  servicesManager,
}: Types.Extensions.ExtensionParams): void {
  addToolInstance(toolNames.DICOMSRDisplay, DICOMSRDisplayTool);
  addToolInstance(toolNames.SRLength, LengthTool);
  addToolInstance(toolNames.SRBidirectional, BidirectionalTool);
  addToolInstance(toolNames.SREllipticalROI, EllipticalROITool);
  addToolInstance(toolNames.SRCircleROI, CircleROITool);
  addToolInstance(toolNames.SRArrowAnnotate, ArrowAnnotateTool);
  addToolInstance(toolNames.SRAngle, AngleTool);
  addToolInstance(toolNames.SRPlanarFreehandROI, PlanarFreehandROITool);

  /** SR subtypes: show label (e.g. Lesion) instead of intensity/stats */
  addTool(SRPointTool);
  addToolInstance(toolNames.SRRectangleROI, RectangleROITool, {
    getTextLines: getSRRectangleROITextLines,
  });

  /** TODO - fix the SR display of Cobb Angle, as it joins the two lines */
  addToolInstance(toolNames.SRCobbAngle, CobbAngleTool);

  const dashedLine = {
    lineDash: '4,4',
  };
  annotation.config.style.setToolGroupToolStyles('SRToolGroup', {
    [toolNames.DICOMSRDisplay]: dashedLine,
    [toolNames.SRPoint]: dashedLine,
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
