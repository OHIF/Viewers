import cornerstoneTools from 'cornerstone-tools';
import cornerstoneMath from 'cornerstone-math';
import cornerstone from 'cornerstone-core';
import TOOL_NAMES from '../constants/toolNames';
import SCOORD_TYPES from '../constants/scoordTypes';

const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

export default function addMeasurement(
  measurement,
  imageId,
  displaySetInstanceUID
) {
  // TODO -> Render rotated ellipse .

  const toolName = TOOL_NAMES.DICOM_SR_DISPLAY_TOOL;

  const measurementData = {
    TrackingUniqueIdentifier: measurement.TrackingUniqueIdentifier,
    renderableData: {},
    labels: measurement.labels,
  };

  measurement.coords.forEach(coord => {
    const { GraphicType, GraphicData } = coord;

    if (measurementData.renderableData[GraphicType] === undefined) {
      measurementData.renderableData[GraphicType] = [];
    }

    measurementData.renderableData[GraphicType].push(
      _getRenderableData(GraphicType, GraphicData)
    );
  });

  const toolState = globalImageIdSpecificToolStateManager.saveToolState();

  if (toolState[imageId] === undefined) {
    toolState[imageId] = {};
  }

  const imageIdToolState = toolState[imageId];

  // If we don't have tool state for this type of tool, add an empty object
  if (imageIdToolState[toolName] === undefined) {
    imageIdToolState[toolName] = {
      data: [],
    };
  }

  const toolData = imageIdToolState[toolName];

  toolData.data.push(measurementData);

  measurement.loaded = true;
  measurement.imageId = imageId;
  measurement.displaySetInstanceUID = displaySetInstanceUID;

  // Remove the unneeded coord now its processed, but keep the SOPInstanceUID.
  // NOTE: We assume that each SCOORD in the MeasurementGroup maps onto one frame,
  // It'd be super werid if it didn't anyway as a SCOORD.
  measurement.ReferencedSOPInstanceUID =
    measurement.coords[0].ReferencedSOPSequence.ReferencedSOPInstanceUID;
  delete measurement.coords;
}

function _getRenderableData(GraphicType, GraphicData) {
  let renderableData;

  switch (GraphicType) {
    case SCOORD_TYPES.POINT:
    case SCOORD_TYPES.MULTIPOINT:
    case SCOORD_TYPES.POLYLINE:
      renderableData = [];

      for (let i = 0; i < GraphicData.length; i += 2) {
        renderableData.push({ x: GraphicData[i], y: GraphicData[i + 1] });
      }
      break;
    case SCOORD_TYPES.CIRCLE:
      const center = { x: GraphicData[0], y: GraphicData[1] };
      const onPerimeter = { x: GraphicData[2], y: GraphicData[3] };

      const radius = cornerstoneMath.point.distance(center, onPerimeter);

      renderableData = {
        center,
        radius,
      };
      break;
    case SCOORD_TYPES.ELLIPSE:
      console.warn('ROTATED ELLIPSE NOT YET SUPPORTED!');

      const majorAxis = [
        { x: GraphicData[0], y: GraphicData[1] },
        { x: GraphicData[2], y: GraphicData[3] },
      ];
      const minorAxis = [
        { x: GraphicData[4], y: GraphicData[5] },
        { x: GraphicData[6], y: GraphicData[7] },
      ];

      // Calculate two opposite corners of box defined by two axes.

      const minorAxisLength = cornerstoneMath.point.distance(
        minorAxis[0],
        minorAxis[1]
      );

      const minorAxisDirection = {
        x: (minorAxis[1].x - minorAxis[0].x) / minorAxisLength,
        y: (minorAxis[1].y - minorAxis[0].y) / minorAxisLength,
      };

      const halfMinorAxisLength = minorAxisLength / 2;

      // First end point of major axis + half minor axis vector
      const corner1 = {
        x: majorAxis[0].x + minorAxisDirection.x * halfMinorAxisLength,
        y: majorAxis[0].y + minorAxisDirection.y * halfMinorAxisLength,
      };

      // Second end point of major axis - half of minor axis vector
      const corner2 = {
        x: majorAxis[1].x - minorAxisDirection.x * halfMinorAxisLength,
        y: majorAxis[1].y - minorAxisDirection.y * halfMinorAxisLength,
      };

      renderableData = {
        corner1,
        corner2,
      };
      break;
  }

  return renderableData;
}
