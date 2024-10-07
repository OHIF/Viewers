import { addUniqueIndex, JOIN_STR } from './presentationUtils';

/**
 * Gets the positionPresentationId for a viewport.
 * Used for retrieving camera/initial position state sync values based on:
 * - viewportOptions.id
 * - viewportOptions.orientation
 * - display set UIDs (excluding segmentations)
 * - a unique index if the generated key is already displayed
 *
 * @param {string} id - The ID to check
 * @param {Object} options - The options object
 * @param {Object} options.viewport - The current viewport
 * @param {Map} options.viewports - The list of all viewports
 * @returns {string|undefined} The positionPresentationId or undefined
 */
const getPositionPresentationId = (id, { viewport, viewports, isUpdatingSameViewport }) => {
  if (id !== 'positionPresentationId') {
    return;
  }

  if (!viewport?.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { viewportOptions, displaySetInstanceUIDs, displaySetOptions } = viewport;
  const { id: viewportOptionId, orientation } = viewportOptions;

  const positionPresentationArr = [orientation || 'acquisition'];
  if (viewportOptionId) {
    positionPresentationArr.push(viewportOptionId);
  }

  if (displaySetOptions.some(ds => ds.options?.blendMode || ds.options?.displayPreset)) {
    positionPresentationArr.push(`custom`);
  }

  for (const uid of displaySetInstanceUIDs) {
    positionPresentationArr.push(uid);
  }

  addUniqueIndex(
    positionPresentationArr,
    'positionPresentationId',
    viewports,
    isUpdatingSameViewport
  );

  return positionPresentationArr.join(JOIN_STR);
};

export default getPositionPresentationId;
