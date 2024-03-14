/**
 * @param {*} cornerstone
 * @param {*} imageId
 */
function getImageSrcFromImageId(cornerstone, imageId) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    // Note: the default width and height of the canvas is 300x150
    // but we need to set the width and height to the same number since
    // the thumbnails are usually square and we want to maintain the aspect ratio
    canvas.width = 300;
    canvas.height = 300;

    cornerstone.utilities
      .loadImageToCanvas({ canvas, imageId })
      .then(imageId => {
        resolve(canvas.toDataURL());
      })
      .catch(reject);
  });
}

export default getImageSrcFromImageId;
