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
  utilities as csToolsUtils,
} from '@cornerstonejs/tools';
import { Types, MeasurementService } from '@ohif/core';
import { StackViewport } from '@cornerstonejs/core';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import SCOORD3DPointTool from './tools/SCOORD3DPointTool';
import SRSCOOR3DProbeMapper from './utils/SRSCOOR3DProbeMapper';
import addToolInstance from './utils/addToolInstance';
import toolNames from './tools/toolNames';

const { CORNERSTONE_3D_TOOLS_SOURCE_NAME, CORNERSTONE_3D_TOOLS_SOURCE_VERSION } = CSExtensionEnums;

/**
 * @param {object} configuration
 */
export default function init({
  configuration = {},
  servicesManager,
}: Types.Extensions.ExtensionParams): void {
  const { measurementService, cornerstoneViewportService } = servicesManager.services;

  addToolInstance(toolNames.DICOMSRDisplay, DICOMSRDisplayTool);
  addToolInstance(toolNames.SRLength, LengthTool);
  addToolInstance(toolNames.SRBidirectional, BidirectionalTool);
  addToolInstance(toolNames.SREllipticalROI, EllipticalROITool);
  addToolInstance(toolNames.SRCircleROI, CircleROITool);
  addToolInstance(toolNames.SRArrowAnnotate, ArrowAnnotateTool);
  addToolInstance(toolNames.SRAngle, AngleTool);
  addToolInstance(toolNames.SRPlanarFreehandROI, PlanarFreehandROITool);
  addToolInstance(toolNames.SRRectangleROI, RectangleROITool);
  addToolInstance(toolNames.SRSCOORD3DPoint, SCOORD3DPointTool);

  // TODO - fix the SR display of Cobb Angle, as it joins the two lines
  addToolInstance(toolNames.SRCobbAngle, CobbAngleTool);

  const csTools3DVer1MeasurementSource = measurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  const { POINT } = measurementService.VALUE_TYPES;

  measurementService.addMapping(
    csTools3DVer1MeasurementSource,
    'SRSCOORD3DPoint',
    POINT,
    SRSCOOR3DProbeMapper.toAnnotation,
    SRSCOOR3DProbeMapper.toMeasurement
  );

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

  measurementService.subscribe(
    MeasurementService.EVENTS.JUMP_TO_MEASUREMENT_LAYOUT,
    ({ viewportId, measurement, isConsumed }) => {
      if (isConsumed) {
        return;
      }
      try {
        const currentViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        const { viewPlaneNormal } = currentViewport.getCamera();
        const referencedImageId = csToolsUtils.getClosestImageIdForStackViewport(
          currentViewport as StackViewport,
          measurement.points[0],
          viewPlaneNormal
        );
        const imageIndex = (currentViewport as StackViewport)
          .getImageIds()
          .indexOf(referencedImageId);
        csToolsUtils.jumpToSlice(currentViewport.element, { imageIndex });
      } catch (error) {
        console.warn('Unable to jump to image based on measurement coordinate', error);
      }
    }
  );
}
