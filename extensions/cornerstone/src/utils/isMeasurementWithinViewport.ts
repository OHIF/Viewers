import { getCenterExtent } from './getCenterExtent';

/**
 * Determines if a measurement is within the current viewport extent.
 * Uses the measurement's bounding box extent to efficiently check if the entire
 * measurement fits within the viewport's visible area.
 *
 * @param {Object} viewport - The viewport object containing camera information
 * @param {Object} measurement - The measurement object containing points to check
 * @returns {boolean} True if the measurement extent is within the viewport, false otherwise
 */
export const isMeasurementWithinViewport = (viewport, measurement) => {
  const camera = viewport.getCamera();
  const { focalPoint, parallelScale } = camera;

  // Get the measurement's bounding box extent
  const { extent } = getCenterExtent(measurement);
  const { min, max } = extent;

  // Check if the entire bounding box fits within the viewport extent
  // We need to check both the min and max corners of the bounding box
  for (let i = 0; i < 3; i++) {
    const minDistance = Math.abs(min[i] - focalPoint[i]);
    const maxDistance = Math.abs(max[i] - focalPoint[i]);

    // If either the min or max point is outside the viewport extent, return false
    if (minDistance > parallelScale || maxDistance > parallelScale) {
      return false;
    }
  }

  return true; // The entire measurement extent is within the viewport
};
