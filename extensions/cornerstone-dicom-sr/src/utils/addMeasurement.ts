import { Types, annotation } from '@cornerstonejs/tools';
import * as cornerstone3D from '@cornerstonejs/core';
import TOOL_NAMES from '../constants/toolNames';
import SCOORD_TYPES from '../constants/scoordTypes';

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
    imageId,
  };

  measurement.coords.forEach(coord => {
    const { GraphicType, GraphicData } = coord;

    if (measurementData.renderableData[GraphicType] === undefined) {
      measurementData.renderableData[GraphicType] = [];
    }

    measurementData.renderableData[GraphicType].push(
      _getRenderableData(GraphicType, GraphicData, imageId)
    );
  });

  // Use the metadata provider to grab its imagePlaneModule metadata
  const imagePlaneModule = cornerstone3D.metaData.get(
    'imagePlaneModule',
    imageId
  );

  const annotationManager = annotation.state.getDefaultAnnotationManager();

  const SRAnnotation: Types.Annotation = {
    annotationUID: measurement.TrackingUniqueIdentifier,
    metadata: {
      FrameOfReferenceUID: imagePlaneModule.frameOfReferenceUID,
      toolName: toolName,
      referencedImageId: imageId,
    },
    data: {
      label: measurement.labels,
      handles: {
        textBox: {},
      },
      cachedStats: {
        TrackingUniqueIdentifier: measurementData.TrackingUniqueIdentifier,
        renderableData: measurementData.renderableData,
      },
    },
  };

  annotationManager.addAnnotation(SRAnnotation);

  measurement.loaded = true;
  measurement.imageId = imageId;
  measurement.displaySetInstanceUID = displaySetInstanceUID;

  // Remove the unneeded coord now its processed, but keep the SOPInstanceUID.
  // NOTE: We assume that each SCOORD in the MeasurementGroup maps onto one frame,
  // It'd be super weird if it didn't anyway as a SCOORD.
  measurement.ReferencedSOPInstanceUID =
    measurement.coords[0].ReferencedSOPSequence.ReferencedSOPInstanceUID;
  delete measurement.coords;
}

function _getRenderableData(GraphicType, GraphicData, imageId) {
  let renderableData;

  switch (GraphicType) {
    case SCOORD_TYPES.POINT:
    case SCOORD_TYPES.MULTIPOINT:
    case SCOORD_TYPES.POLYLINE:
      renderableData = [];

      for (let i = 0; i < GraphicData.length; i += 2) {
        const worldPos = cornerstone3D.utilities.imageToWorldCoords(imageId, [
          GraphicData[i],
          GraphicData[i + 1],
        ]);

        renderableData.push(worldPos);
      }
      break;
    case SCOORD_TYPES.CIRCLE: {
      // Todo:
      const center = { x: GraphicData[0], y: GraphicData[1] };
      const onPerimeter = { x: GraphicData[2], y: GraphicData[3] };

      const radius = cornerstoneMath.point.distance(center, onPerimeter);

      renderableData = {
        center,
        radius,
      };
      break;
    }
    case SCOORD_TYPES.ELLIPSE: {
      // Todo:
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
    default:
      console.warn('Unsupported GraphicType:', GraphicType);
  }

  return renderableData;
}
