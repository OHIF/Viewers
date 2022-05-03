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
      // Todo: write cornerstone3D circle logic
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
      // GraphicData is ordered as [majorAxisStartX, majorAxisStartY, majorAxisEndX, majorAxisEndY, minorAxisStartX, minorAxisStartY, minorAxisEndX, minorAxisEndY]
      // But Cornerstone3D points are ordered as top, bottom, left, right for the
      // ellipse so we need to identify if the majorAxis is horizontal or vertical
      // and then choose the correct points to use for the ellipse.

      const majorAxisStart = { x: GraphicData[0], y: GraphicData[1] };
      const majorAxisEnd = { x: GraphicData[2], y: GraphicData[3] };
      const minorAxisStart = { x: GraphicData[4], y: GraphicData[5] };
      const minorAxisEnd = { x: GraphicData[6], y: GraphicData[7] };

      const majorAxisIsHorizontal = majorAxisStart.y === majorAxisEnd.y;
      const majorAxisIsVertical = majorAxisStart.x === majorAxisEnd.x;

      let ellipsePointsImage;

      if (majorAxisIsVertical) {
        ellipsePointsImage = [
          majorAxisStart.x,
          majorAxisStart.y,
          majorAxisEnd.x,
          majorAxisEnd.y,
          minorAxisStart.x,
          minorAxisStart.y,
          minorAxisEnd.x,
          minorAxisEnd.y,
        ];
      } else if (majorAxisIsHorizontal) {
        ellipsePointsImage = [
          minorAxisStart.x,
          minorAxisStart.y,
          minorAxisEnd.x,
          minorAxisEnd.y,
          majorAxisStart.x,
          majorAxisStart.y,
          majorAxisEnd.x,
          majorAxisEnd.y,
        ];
      } else {
        throw new Error('ROTATED ELLIPSE NOT YET SUPPORTED');
      }

      const ellipsePointsWorld = [];
      for (let i = 0; i < ellipsePointsImage.length; i += 2) {
        const worldPos = cornerstone3D.utilities.imageToWorldCoords(imageId, [
          ellipsePointsImage[i],
          ellipsePointsImage[i + 1],
        ]);

        ellipsePointsWorld.push(worldPos);
      }

      renderableData = ellipsePointsWorld;
      break;
    }
    default:
      console.warn('Unsupported GraphicType:', GraphicType);
  }

  return renderableData;
}
