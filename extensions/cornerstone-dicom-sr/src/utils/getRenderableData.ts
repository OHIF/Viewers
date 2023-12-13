import { vec3 } from 'gl-matrix';
import { metaData, utilities, Types as csTypes } from '@cornerstonejs/core';
import SCOORD_TYPES from '../constants/scoordTypes';

const EPSILON = 1e-4;

function imageToWorldCoords(imageId, imageCoords) {
  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

  if (!imagePlaneModule) {
    throw new Error(`No imagePlaneModule found for imageId: ${imageId}`);
  }

  const { columnCosines, rowCosines, imagePositionPatient: origin } = imagePlaneModule;

  let { columnPixelSpacing, rowPixelSpacing } = imagePlaneModule;
  // Use ||= to convert null and 0 as well as undefined to 1
  columnPixelSpacing ||= 1;
  rowPixelSpacing ||= 1;

  // calculate the image coordinates in the world space
  const imageCoordsInWorld = vec3.create();

  // move from origin in the direction of the row cosines with the amount of
  // row pixel spacing times the first element of the image coordinates vector
  vec3.scaleAndAdd(
    imageCoordsInWorld,
    origin,
    rowCosines,
    // to accommodate the [0,0] being on the top left corner of the top left pixel
    // but the origin is at the center of the top left pixel
    rowPixelSpacing * (imageCoords[0] - 0.5)
  );

  vec3.scaleAndAdd(
    imageCoordsInWorld,
    imageCoordsInWorld,
    columnCosines,
    columnPixelSpacing * (imageCoords[1] - 0.5)
  );

  vec3.scaleAndAdd(
    imageCoordsInWorld,
    imageCoordsInWorld,
    columnCosines,
    columnPixelSpacing * (imageCoords[2] - 0.5)
  );

  return Array.from(imageCoordsInWorld);
}

function getRenderableData(GraphicType, GraphicData, imageId) {
  let renderableData;

  switch (GraphicType) {
    case SCOORD_TYPES.POINT:
    case SCOORD_TYPES.MULTIPOINT:
    case SCOORD_TYPES.POLYLINE:
      renderableData = [];

      for (let i = 0; i < GraphicData.length; i += 3) {
        const worldPos = imageToWorldCoords(imageId, [
          GraphicData[i],
          GraphicData[i + 1],
          GraphicData[i + 2],
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

export default getRenderableData;
