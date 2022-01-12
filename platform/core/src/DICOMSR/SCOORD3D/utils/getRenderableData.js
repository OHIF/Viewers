import csMath from 'cornerstone-math';
import SCOORD_TYPES from '../constants/scoordTypes';

const getRenderableData = (
  GraphicType,
  GraphicData,
  ValueType,
  imageMetadata
) => {
  let renderableData;

  const center = [
    parseInt(imageMetadata.Rows) * 0.5,
    parseInt(imageMetadata.Columns) * 0.5,
  ];

  // https://dicom.innolitics.com/ciods/procedure-log/sr-document-content/00700023
  switch (GraphicType) {
    case SCOORD_TYPES.POINT:
      renderableData = [];

      if (ValueType === 'SCOORD3D') {
        for (let i = 0; i < GraphicData.length; i += 3) {
          renderableData.push({
            x: GraphicData[i] + center[0],
            y: GraphicData[i + 1] + center[1],
            z: GraphicData[i + 2],
          });
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
          renderableData.push({
            x: GraphicData[i] + center[0],
            y: GraphicData[i + 1] + center[1],
            z: GraphicData[i + 2],
          });
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
          renderableData.push({
            x: GraphicData[i] + center[0],
            y: GraphicData[i + 1] + center[1],
            z: GraphicData[i + 2],
          });
        }
      } else {
        for (let i = 0; i < GraphicData.length; i += 2) {
          renderableData.push({ x: GraphicData[i], y: GraphicData[i + 1] });
        }
      }

      break;
    case SCOORD_TYPES.POLYGON:
      renderableData = [];
      for (let i = 0; i < GraphicData.length; i += 3) {
        renderableData.push({
          x: GraphicData[i] + center[0],
          y: GraphicData[i + 1] + center[1],
          z: GraphicData[i + 2],
        });
      }
      break;
    case SCOORD_TYPES.CIRCLE: {
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
