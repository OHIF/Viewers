import csMath from 'cornerstone-math';
import SCOORD_TYPES from '../constants/scoordTypes';
import { inv } from 'mathjs';

const getRenderableData = (
  GraphicType,
  GraphicData,
  ValueType,
  imageMetadata
) => {
  let renderableData;

  const orientation = imageMetadata.ImageOrientationPatient;
  const position = imageMetadata.ImagePositionPatient;
  const pixelSpacing = imageMetadata.PixelSpacing;
  const sliceSpacing = imageMetadata.SliceThickness
    ? imageMetadata.SliceThickness
    : 1;
  //  https://nipy.org/nibabel/dicom/dicom_orientation.html
  const M = [
    [
      orientation[0] * pixelSpacing[0],
      orientation[3] * pixelSpacing[1],
      sliceSpacing,
      position[0],
    ],
    [
      orientation[1] * pixelSpacing[0],
      orientation[4] * pixelSpacing[1],
      sliceSpacing,
      position[1],
    ],
    [
      orientation[2] * pixelSpacing[0],
      orientation[5] * pixelSpacing[1],
      sliceSpacing,
      position[2],
    ],
    [0, 0, 0, 1],
  ];

  // we need to go from 3D to pixel (cornerstone2D works in pixel coordinates),
  // we take the inverse.
  const M1 = inv(M);

  const worldToIJK = (point, M1) => {
    const worldPoint = {
      x:
        M1[0][0] * point.x + M1[0][1] * point.y + M1[0][2] * point.z + M1[0][3],
      y:
        M1[1][0] * point.x + M1[1][1] * point.y + M1[1][2] * point.z + M1[1][3],
      z:
        M1[2][0] * point.x + M1[2][1] * point.y + M1[2][2] * point.z + M1[2][3],
    };
    return worldPoint;
  };

  // https://dicom.innolitics.com/ciods/procedure-log/sr-document-content/00700023
  switch (GraphicType) {
    case SCOORD_TYPES.TEXT:
      renderableData = [{ x: GraphicData[0], y: GraphicData[1] }];

      break;
    case SCOORD_TYPES.POINT:
      renderableData = [];

      if (ValueType === 'SCOORD3D') {
        for (let i = 0; i < GraphicData.length; i += 3) {
          const point = {
            x: GraphicData[i],
            y: GraphicData[i + 1],
            z: GraphicData[i + 2],
          };

          renderableData.push(worldToIJK(point, M1));
        }
      } else {
        for (let i = 0; i < GraphicData.length; i += 2) {
          renderableData.push({ x: GraphicData[i], y: GraphicData[i + 1] });
        }
      }

      break;
    case SCOORD_TYPES.MULTIPOINT:
      renderableData = [];

      if (ValueType === 'SCOORD3D') {
        for (let i = 0; i < GraphicData.length; i += 3) {
          const point = {
            x: GraphicData[i],
            y: GraphicData[i + 1],
            z: GraphicData[i + 2],
          };

          renderableData.push(worldToIJK(point, M1));
        }
      } else {
        for (let i = 0; i < GraphicData.length; i += 2) {
          renderableData.push({ x: GraphicData[i], y: GraphicData[i + 1] });
        }
      }

      break;
    case SCOORD_TYPES.POLYLINE:
      renderableData = [];

      if (ValueType === 'SCOORD3D') {
        for (let i = 0; i < GraphicData.length; i += 3) {
          const point = {
            x: GraphicData[i],
            y: GraphicData[i + 1],
            z: GraphicData[i + 2],
          };

          renderableData.push(worldToIJK(point, M1));
        }
      } else {
        for (let i = 0; i < GraphicData.length; i += 2) {
          renderableData.push({ x: GraphicData[i], y: GraphicData[i + 1] });
        }
      }

      break;
    case SCOORD_TYPES.POLYGON:
      // this is only scoord3d
      renderableData = [];
      for (let i = 0; i < GraphicData.length; i += 3) {
        const point = {
          x: GraphicData[i],
          y: GraphicData[i + 1],
          z: GraphicData[i + 2],
        };

        renderableData.push(worldToIJK(point, M1));
      }
      break;
    case SCOORD_TYPES.CIRCLE: {
      // this is only scoord
      const center = { x: GraphicData[0], y: GraphicData[1] };
      const onPerimeter = { x: GraphicData[2], y: GraphicData[3] };

      const radius = csMath.point.distance(center, onPerimeter);

      renderableData = {
        center,
        radius,
      };
      break;
    }
    case SCOORD_TYPES.ELLIPSE: {
      console.warn('ROTATED ELLIPSE NOT YET SUPPORTED!');
      // To Do: scoord3d ellips, need data for testing
      const majorAxis = [
        { x: GraphicData[0], y: GraphicData[1] },
        { x: GraphicData[2], y: GraphicData[3] },
      ];
      const minorAxis = [
        { x: GraphicData[4], y: GraphicData[5] },
        { x: GraphicData[6], y: GraphicData[7] },
      ];

      // Calculate two opposite corners of box defined by two axes.

      const minorAxisLength = csMath.point.distance(minorAxis[0], minorAxis[1]);

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
  }

  return renderableData;
};

export default getRenderableData;
