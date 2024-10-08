import { addUniqueIndex, DEFAULT_STR, JOIN_STR } from './presentationUtils';

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
 * @returns {string|undefined} The segmentationPresentationId or undefined
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

  if (!viewport?.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { displaySetInstanceUIDs } = viewport;

  const segmentationPresentationArr = [...displaySetInstanceUIDs];

  // Probably we don't need this for segmentation presentation id since we want
  // the segmentation to appear on all the viewports with the same displayset i guess?

  // addUniqueIndex(
  //   segmentationPresentationArr,
  //   'segmentationPresentationId',
  //   viewports,
  //   isUpdatingSameViewport
  // );

  return segmentationPresentationArr.join(JOIN_STR);
};

export default getSegmentationPresentationId;
