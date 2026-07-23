import { vec3 } from 'gl-matrix';
import { metaData, utilities, Types as csTypes } from '@cornerstonejs/core';

import { SCOORDTypes } from '../enums';

const EPSILON = 1e-4;

const getRenderableCoords = ({ GraphicData, ValueType, imageId }) => {
  const renderableData = [];
  if (ValueType === 'SCOORD3D') {
    for (let i = 0; i < GraphicData.length; i += 3) {
      renderableData.push([GraphicData[i], GraphicData[i + 1], GraphicData[i + 2]]);
    }
  } else {
    for (let i = 0; i < GraphicData.length; i += 2) {
      const worldPos = utilities.imageToWorldCoords(imageId, [GraphicData[i], GraphicData[i + 1]]);
      renderableData.push(worldPos);
    }
  }
  return renderableData;
};

function getRenderableData({ GraphicType, GraphicData, ValueType, imageId }) {
  let renderableData = [];

  switch (GraphicType) {
    case SCOORDTypes.POINT:
    case SCOORDTypes.MULTIPOINT:
    case SCOORDTypes.POLYLINE: {
      renderableData = getRenderableCoords({ GraphicData, ValueType, imageId });
      break;
    }
    case SCOORDTypes.CIRCLE: {
      const pointsWorld: csTypes.Point3[] = getRenderableCoords({
        GraphicData,
        ValueType,
        imageId,
      });

      if (!imageId) {
        // without the image id it's not possible to perform the calculations below
        // these calculations also do not seem to be needed, since everything works
        // just fine when we skip them. At least for SCOORD3D annotations.
        return pointsWorld;
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

      const firstAxisStart = vec3.create();
      vec3.scaleAndAdd(firstAxisStart, center, columnCosines, radius);

      const firstAxisEnd = vec3.create();
      vec3.scaleAndAdd(firstAxisEnd, center, columnCosines, -radius);

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
    case SCOORDTypes.ELLIPSE: {
      // GraphicData is ordered as [majorAxisStartX, majorAxisStartY, majorAxisEndX, majorAxisEndY, minorAxisStartX, minorAxisStartY, minorAxisEndX, minorAxisEndY]
      // But Cornerstone3D points are ordered as top, bottom, left, right for the
      // ellipse so we need to identify if the majorAxis is horizontal or vertical
      // and then choose the correct points to use for the ellipse.
      const pointsWorld: csTypes.Point3[] = getRenderableCoords({
        GraphicData,
        ValueType,
        imageId,
      });

      if (!imageId) {
        // without the image id it's not possible to perform the calculations below
        // these calculations also do not seem to be needed, since everything works
        // just fine when we skip them. At least for SCOORD3D annotations.
        return pointsWorld;
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
