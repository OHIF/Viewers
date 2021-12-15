import csMath from 'cornerstone-math';
import SCOORD_TYPES from '../constants/scoordTypes';

const getRenderableData = (
  GraphicType,
  GraphicData,
  ValueType,
  imageMetadata
) => {
  let renderableData;

  // Question for Steve and Andrey, with study 1.3.6.1.4.1.14519.5.2.1.6279.6001.100063870746088919758706456900
  // (the one with ~1000 polygons), looks like the SCOORD3D coordinates are given respect to the
  // center of the image, however in the dicom refers that the coordinates are given respect to
  // the reference. Should we use then ImagePositionPatient from the metadata as center?
  const center = [
    parseInt(imageMetadata.Rows) * 0.5,
    parseInt(imageMetadata.Columns) * 0.5,
  ];

  // NOTE: assuming that ImageOriatationPatient is [1,0,0,0,1,0], should we consider different values?
  switch (GraphicType) {
    case SCOORD_TYPES.POINT:
    case SCOORD_TYPES.MULTIPOINT:
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
      // is this only SCOORD3D?
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
