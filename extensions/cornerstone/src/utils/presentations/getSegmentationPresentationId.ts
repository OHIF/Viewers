import { addUniqueIndex, DEFAULT_STR, JOIN_STR } from './presentationUtils';

function _getSegmentationId(ds, viewport) {
  // check the segmentations for this viewport and displaySetInstanceUIDs
}

/**
 * Gets the segmentationPresentationId for a viewport.
 * Used for retrieving segmentation information based on:
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
const getSegmentationPresentationId = (
  id,
  {
    viewport,
    viewports,
    isUpdatingSameViewport,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    viewports: AppTypes.ViewportGrid.Viewports;
    isUpdatingSameViewport: boolean;
  }
) => {
  if (id !== 'segmentationPresentationId') {
    return;
  }

  if (!viewport || !viewport.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { displaySetOptions, displaySetInstanceUIDs } = viewport;
  const segmentationId = _getSegmentationId(displaySetOptions[0], viewport);
  const segmentationPresentationArr = [segmentationId];

  for (const uid of displaySetInstanceUIDs) {
    segmentationPresentationArr.push(uid);
  }

  addUniqueIndex(
    segmentationPresentationArr,
    'segmentationPresentationId',
    viewports,
    isUpdatingSameViewport
  );

  return segmentationPresentationArr.join(JOIN_STR);
};

export default getSegmentationPresentationId;
