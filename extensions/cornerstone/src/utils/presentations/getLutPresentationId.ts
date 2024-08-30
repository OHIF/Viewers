import { addUniqueIndex, DEFAULT_STR, JOIN_STR } from './presentationUtils';

const getLutId = (ds): string => {
  if (!ds || !ds.options) {
    return DEFAULT_STR;
  }
  if (ds.options.id) {
    return ds.options.id;
  }
  const arr = Object.entries(ds.options).map(([key, val]) => `${key}=${val}`);
  if (!arr.length) {
    return DEFAULT_STR;
  }
  return arr.join(JOIN_STR);
};

/**
 * Gets the lutPresentationId for a viewport.
 * Used for retrieving VOI LUT information based on:
 * - displaySetOption[0].options (including id if present)
 * - displaySetUIDs
 * - a unique index if the generated key is already displayed
 *
 * @param {string} id - The ID to check
 * @param {Object} options - The options object
 * @param {Object} options.viewport - The current viewport
 * @param {Map} options.viewports - The list of all viewports
 * @returns {string|undefined} The lutPresentationId or undefined
 */
const getLutPresentationId = (id, { viewport, viewports, isUpdatingSameViewport }) => {
  if (id !== 'lutPresentationId') {
    return;
  }

  if (!viewport || !viewport.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { displaySetOptions, displaySetInstanceUIDs } = viewport;
  const lutId = getLutId(displaySetOptions[0]);
  const lutPresentationArr = [lutId];

  for (const uid of displaySetInstanceUIDs) {
    lutPresentationArr.push(uid);
  }

  addUniqueIndex(lutPresentationArr, 'lutPresentationId', viewports, isUpdatingSameViewport);

  return lutPresentationArr.join(JOIN_STR);
};

export default getLutPresentationId;
