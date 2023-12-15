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
import { MeasurementService, Types } from '@ohif/core';
import toolNames from './tools/toolNames';
import DICOMSRDisplayMapping from './DICOMSRDisplayMapping';

/**
 * @param {object} configuration
 */
export default function init({
  servicesManager,
  extensionManager,
  configuration = {},
}: Types.Extensions.ExtensionParams): void {
  const { measurementService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

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

  /** TODO: Get name/version from cs extension */
  const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
  const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';
  const source = measurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );
  measurementService.addMapping(
    source,
    toolNames.DICOMSRDisplay,
    [
      {
        valueType: MeasurementService.VALUE_TYPES.POINT,
        points: 1,
      },
    ],
    DICOMSRDisplayMapping.toAnnotation,
    csToolsAnnotation =>
      DICOMSRDisplayMapping.toMeasurement(
        csToolsAnnotation,
        displaySetService,
        cornerstoneViewportService
      )
  );

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
