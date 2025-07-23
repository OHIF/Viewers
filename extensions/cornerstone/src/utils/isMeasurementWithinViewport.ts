/**
 * Determines if a measurement is within the current viewport extent.
 * Checks if all measurement points fall within the visible area defined by the camera's
 * focal point and parallel scale (extent boundaries).
 *
 * @param {Object} params - The parameters object
 * @param {Object} params.viewport - The viewport object containing camera information
 * @param {Object} params.measurement - The measurement object containing points to check
 * @param {Array<Array<number>>} params.measurement.points - Array of 3D points [x, y, z]
 * @returns {boolean} True if all measurement points are within the viewport extent, false otherwise
 */
export const isMeasurementWithinViewport = ({ viewport, measurement }) => {
  const camera = viewport.getCamera();
  const { focalPoint, parallelScale } = camera;
  // Check if the measurement points are inside the extent
  for (const point of measurement.points) {
    const [x, y, z] = point;
    // Calculate the distance from the focal point
    const dx = x - focalPoint[0];
    const dy = y - focalPoint[1];
    const dz = z - focalPoint[2];
    // Check if the point is within the extent
    if (
      Math.abs(dx) > parallelScale ||
      Math.abs(dy) > parallelScale ||
      Math.abs(dz) > parallelScale
    ) {
      return false; // Point is outside the extent
    }
  }
  return true; // All points are inside the extent
};
