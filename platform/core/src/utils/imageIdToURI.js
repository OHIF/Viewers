/**
 * Removes the data loader scheme from the imageId
 *
 * @param {string} imageId Image ID
 * @returns {string} imageId without the data loader scheme
 * @memberof Cache
 */
export default function imageIdToURI(imageId) {
  const colonIndex = imageId.indexOf(':');

  return imageId.substring(colonIndex + 1);
}

/**
 * Normalizes an imageId to the metadata lookup key (scheme stripped, frame query removed).
 * Must match MetadataProvider.getUIDsFromImageID lookup behavior.
 */
export function baseImageURIForMetadata(imageId) {
  const urlRegex = /^(http|https|dicomfile):\/\//;
  let imageURI;

  if (urlRegex.test(imageId)) {
    imageURI = imageId;
  } else {
    imageURI = imageIdToURI(imageId);
  }

  return imageURI.split('&frame=')[0].split('?frame=')[0];
}
