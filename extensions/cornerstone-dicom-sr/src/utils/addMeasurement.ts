import { vec3 } from 'gl-matrix';
import { Types, annotation } from '@cornerstonejs/tools';
import * as cornerstone3D from '@cornerstonejs/core';
import TOOL_NAMES from '../constants/toolNames';
import SCOORD_TYPES from '../constants/scoordTypes';

const EPSILON = 1e-4;

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
  let renderableData: cornerstone3D.Types.Point3[];

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
      throw new Error('Not implemented in cs3d yet');
      // const center = { x: GraphicData[0], y: GraphicData[1] };
      // const onPerimeter = { x: GraphicData[2], y: GraphicData[3] };

      // const radius = cornerstoneMath.point.distance(center, onPerimeter);

      // renderableData = {
      //   center,
      //   radius,
      // };
      // break;
    }
    case SCOORD_TYPES.ELLIPSE: {
      // GraphicData is ordered as [majorAxisStartX, majorAxisStartY, majorAxisEndX, majorAxisEndY, minorAxisStartX, minorAxisStartY, minorAxisEndX, minorAxisEndY]
      // But Cornerstone3D points are ordered as top, bottom, left, right for the
      // ellipse so we need to identify if the majorAxis is horizontal or vertical
      // and then choose the correct points to use for the ellipse.

      const pointsWorld: cornerstone3D.Types.Point3[] = [];
      for (let i = 0; i < GraphicData.length; i += 2) {
        const worldPos = cornerstone3D.utilities.imageToWorldCoords(imageId, [
          GraphicData[i],
          GraphicData[i + 1],
        ]);

        pointsWorld.push(worldPos);
      }

      const majorAxisStart = vec3.fromValues(...pointsWorld[0]);
      const majorAxisEnd = vec3.fromValues(...pointsWorld[1]);
      const minorAxisStart = vec3.fromValues(...pointsWorld[2]);
      const minorAxisEnd = vec3.fromValues(...pointsWorld[3]);

      const majorAxisVec = vec3.create();
      vec3.sub(majorAxisVec, majorAxisEnd, majorAxisStart);

      const minorAxisVec = vec3.create();
      vec3.sub(minorAxisVec, minorAxisEnd, minorAxisStart);

      const imagePlaneModule = cornerstone3D.metaData.get(
        'imagePlaneModule',
        imageId
      );

      if (!imagePlaneModule) {
        throw new Error('imageId does not have imagePlaneModule metadata');
      }

      const {
        columnCosines,
      }: { columnCosines: cornerstone3D.Types.Point3 } = imagePlaneModule;

      // find which axis is parallel to the columnCosines
      const columnCosinesVec = vec3.fromValues(...columnCosines);

      const projectedMajorAxisOnColVec = Math.abs(
        vec3.dot(columnCosinesVec, majorAxisVec)
      );
      const projectedMinorAxisOnColVec = Math.abs(
        vec3.dot(columnCosinesVec, minorAxisVec)
      );

      renderableData = [];
      if (projectedMajorAxisOnColVec < EPSILON) {
        // minor axis is vertical
        renderableData = [
          pointsWorld[2],
          pointsWorld[3],
          pointsWorld[0],
          pointsWorld[1],
        ];
      } else if (projectedMinorAxisOnColVec < EPSILON) {
        // major axis is vertical
        renderableData = [
          pointsWorld[0],
          pointsWorld[1],
          pointsWorld[2],
          pointsWorld[3],
        ];
      } else {
        console.warn('OBLIQUE ELLIPSE NOT YET SUPPORTED');
      }
      break;
    }
    default:
      console.warn('Unsupported GraphicType:', GraphicType);
  }

  return renderableData;
}
