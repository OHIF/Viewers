/**
 * @param {*} cornerstone
 * @param {*} imageId
 */
function getImageSrcFromImageId(cornerstone, imageId) {
  return new Promise((resolve, reject) => {
    cornerstone
      .loadAndCacheImage(imageId)
      .then(image => {
        const canvas = document.createElement('canvas');
        cornerstone.renderToCanvas(canvas, image);

        resolve(canvas.toDataURL());
      })
      .catch(reject);
  });
}

export default getImageSrcFromImageId;
