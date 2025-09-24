/**
 * Calculates the center point and bounding box extent of a measurement based on its points.
 * @param {Object} measurement - The measurement object containing points
 * @param {Array<Array<number>>} measurement.points - Array of 3D points [x, y, z]
 * @returns {Object} Object containing center and extent
 * @returns {Array<number>} returns.center - The center point [x, y, z]
 * @returns {Object} returns.extent - The bounding box extent with min and max points
 */
export const getCenterExtent = (measurement: { points?: number[][] }) => {
  const { points } = measurement;

  if (!points || !Array.isArray(points) || points.length === 0) {
    // Return default values if no points are available
    const defaultCenter: [number, number, number] = [0, 0, 0];
    const defaultExtent = {
      min: [0, 0, 0] as [number, number, number],
      max: [0, 0, 0] as [number, number, number],
    };
    return { center: defaultCenter, extent: defaultExtent };
  }

  // Initialize min and max with the first point
  const min: [number, number, number] = [...points[0]] as [number, number, number];
  const max: [number, number, number] = [...points[0]] as [number, number, number];

  // Find the bounding box by iterating through all points
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    for (let j = 0; j < 3; j++) {
      min[j] = Math.min(min[j], point[j]);
      max[j] = Math.max(max[j], point[j]);
    }
  }

  // Calculate the center point
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  return {
    center,
    extent: { min, max },
  };
};
