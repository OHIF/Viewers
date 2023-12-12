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

const _getValueTypeFromToolType = toolType => {
  const { POLYLINE, ELLIPSE, CIRCLE, RECTANGLE, BIDIRECTIONAL, POINT, ANGLE } =
    MeasurementService.VALUE_TYPES;

  // TODO -> I get why this was attempted, but its not nearly flexible enough.
  // A single measurement may have an ellipse + a bidirectional measurement, for instances.
  // You can't define a bidirectional tool as a single type..
  const TOOL_TYPE_TO_VALUE_TYPE = {
    Length: POLYLINE,
    EllipticalROI: ELLIPSE,
    CircleROI: CIRCLE,
    RectangleROI: RECTANGLE,
    PlanarFreehandROI: POLYLINE,
    Bidirectional: BIDIRECTIONAL,
    ArrowAnnotate: POINT,
    CobbAngle: ANGLE,
    Angle: ANGLE,
  };

  return TOOL_TYPE_TO_VALUE_TYPE[toolType];
};

/**
 * @param {object} configuration
 */
export default function init({
  servicesManager,
  configuration = {},
}: Types.Extensions.ExtensionParams): void {
  const { measurementService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  addTool(DICOMSRDisplayTool);
  console.debug('Adding SR tool...');
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
    'DICOMSRDisplay',
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
        cornerstoneViewportService,
        _getValueTypeFromToolType
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
