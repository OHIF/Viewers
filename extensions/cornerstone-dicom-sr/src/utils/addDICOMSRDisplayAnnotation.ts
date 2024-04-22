import { vec3 } from 'gl-matrix';
import { Types, annotation } from '@cornerstonejs/tools';
import { metaData, utilities, Types as csTypes } from '@cornerstonejs/core';

import toolNames from '../tools/toolNames';
import SCOORD_TYPES from '../constants/scoordTypes';

const EPSILON = 1e-4;

export default function addDICOMSRDisplayAnnotation(measurement, imageId, frameNumber) {
  const toolName = toolNames.DICOMSRDisplay;

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

  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

  /**
   * This annotation (DICOMSRDisplay) is only used by the SR viewport.
   * This is used before the annotation is hydrated. If hydrated the measurement will be added
   * to the measurement service and will be available for the other viewports.
   */
  const SRAnnotation: Types.Annotation = {
    annotationUID: measurement.TrackingUniqueIdentifier,
    highlighted: false,
    isLocked: false,
    invalidated: false,
    metadata: {
      toolName: toolName,
      FrameOfReferenceUID: imagePlaneModule.frameOfReferenceUID,
      referencedImageId: imageId,
    },
    data: {
      label: measurement.labels,
      handles: {
        textBox: measurement.textBox ?? {},
      },
      cachedStats: {},
      TrackingUniqueIdentifier: measurementData.TrackingUniqueIdentifier,
      renderableData: measurementData.renderableData,
      frameNumber,
    },
  };
  const annotationManager = annotation.state.getAnnotationManager();
  annotationManager.addAnnotation(SRAnnotation);
}

function _getRenderableData(GraphicType, GraphicData, imageId) {
  let renderableData: csTypes.Point3[];

  switch (GraphicType) {
    case SCOORD_TYPES.POINT:
    case SCOORD_TYPES.MULTIPOINT:
    case SCOORD_TYPES.POLYLINE:
      renderableData = [];

      for (let i = 0; i < GraphicData.length; i += 2) {
        const worldPos = utilities.imageToWorldCoords(imageId, [
          GraphicData[i],
          GraphicData[i + 1],
        ]);

        renderableData.push(worldPos);
      }

      break;
    case SCOORD_TYPES.CIRCLE: {
      const pointsWorld = [];
      for (let i = 0; i < GraphicData.length; i += 2) {
        const worldPos = utilities.imageToWorldCoords(imageId, [
          GraphicData[i],
          GraphicData[i + 1],
        ]);

        pointsWorld.push(worldPos);
      }

      // We do not have an explicit draw circle svg helper in Cornerstone3D at
      // this time, but we can use the ellipse svg helper to draw a circle, so
      // here we reshape the data for that purpose.
      const center = pointsWorld[0];
      const onPerimeter = pointsWorld[1];

      const radius = vec3.distance(center, onPerimeter);

      const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

      if (!imagePlaneModule) {
        throw new Error('No imagePlaneModule found');
      }

      const {
        columnCosines,
        rowCosines,
      }: {
        columnCosines: csTypes.Point3;
        rowCosines: csTypes.Point3;
      } = imagePlaneModule;

      // we need to get major/minor axis (which are both the same size major = minor)

      // first axisStart
      const firstAxisStart = vec3.create();
      vec3.scaleAndAdd(firstAxisStart, center, columnCosines, radius);

      const firstAxisEnd = vec3.create();
      vec3.scaleAndAdd(firstAxisEnd, center, columnCosines, -radius);

      // second axisStart
      const secondAxisStart = vec3.create();
      vec3.scaleAndAdd(secondAxisStart, center, rowCosines, radius);

      const secondAxisEnd = vec3.create();
      vec3.scaleAndAdd(secondAxisEnd, center, rowCosines, -radius);

      renderableData = [
        firstAxisStart as csTypes.Point3,
        firstAxisEnd as csTypes.Point3,
        secondAxisStart as csTypes.Point3,
        secondAxisEnd as csTypes.Point3,
      ];

      break;
    }
    case SCOORD_TYPES.ELLIPSE: {
      // GraphicData is ordered as [majorAxisStartX, majorAxisStartY, majorAxisEndX, majorAxisEndY, minorAxisStartX, minorAxisStartY, minorAxisEndX, minorAxisEndY]
      // But Cornerstone3D points are ordered as top, bottom, left, right for the
      // ellipse so we need to identify if the majorAxis is horizontal or vertical
      // and then choose the correct points to use for the ellipse.

      const pointsWorld: csTypes.Point3[] = [];
      for (let i = 0; i < GraphicData.length; i += 2) {
        const worldPos = utilities.imageToWorldCoords(imageId, [
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

      // normalize majorAxisVec to avoid scaling issues
      vec3.normalize(majorAxisVec, majorAxisVec);

      const minorAxisVec = vec3.create();
      vec3.sub(minorAxisVec, minorAxisEnd, minorAxisStart);
      vec3.normalize(minorAxisVec, minorAxisVec);

      const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

      if (!imagePlaneModule) {
        throw new Error('imageId does not have imagePlaneModule metadata');
      }

      const { columnCosines }: { columnCosines: csTypes.Point3 } = imagePlaneModule;

      // find which axis is parallel to the columnCosines
      const columnCosinesVec = vec3.fromValues(...columnCosines);

      const projectedMajorAxisOnColVec = Math.abs(vec3.dot(columnCosinesVec, majorAxisVec));
      const projectedMinorAxisOnColVec = Math.abs(vec3.dot(columnCosinesVec, minorAxisVec));

      const absoluteOfMajorDotProduct = Math.abs(projectedMajorAxisOnColVec);
      const absoluteOfMinorDotProduct = Math.abs(projectedMinorAxisOnColVec);

      renderableData = [];
      if (Math.abs(absoluteOfMajorDotProduct - 1) < EPSILON) {
        renderableData = [pointsWorld[0], pointsWorld[1], pointsWorld[2], pointsWorld[3]];
      } else if (Math.abs(absoluteOfMinorDotProduct - 1) < EPSILON) {
        renderableData = [pointsWorld[2], pointsWorld[3], pointsWorld[0], pointsWorld[1]];
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
