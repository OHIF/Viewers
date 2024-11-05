import { Types } from '@cornerstonejs/core';

const orientationDirectionVectorMap: { [key: string]: Types.Point3 } = {
  L: [1, 0, 0], // Left
  R: [-1, 0, 0], // Right
  P: [0, 1, 0], // Posterior/ Back
  A: [0, -1, 0], // Anterior/ Front
  H: [0, 0, 1], // Head/ Superior
  F: [0, 0, -1], // Feet/ Inferior
};

export default orientationDirectionVectorMap;
