/**
 * @param {*} cornerstone
 * @param {*} imageId
 */
function getImageSrcFromImageId(cornerstone, imageId) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    cornerstone.utilities
      .loadImageToCanvas({ canvas, imageId })
      .then(imageId => {
        resolve(canvas.toDataURL());
      })
      .catch(reject);
  });
}
export default getImageSrcFromImageId;
