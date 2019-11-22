import cornerstone from "cornerstone-core";

export default function setPixelDataOfSubVolume(
  backgroundVolume,
  imageIds,
  extent
) {
  const promises = [];
  const { bottomImageIdIndex, height, width, topLeft, numFrames } = extent;
  const frameLength = width * height;
  let imageIdIndex = bottomImageIdIndex;

  for (let inStackIndex = 0; inStackIndex < numFrames; inStackIndex++) {
    const imageId = imageIds[imageIdIndex];
    const offset = frameLength * inStackIndex;

    const promise = cornerstone.loadAndCacheImage(imageId).then(image => {
      const imageWidth = image.width;
      const imageHeight = image.height;
      const pixelData = image.getPixelData().slice(0, imageWidth * imageHeight);

      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          const pixel =
            pixelData[(j + topLeft.y) * imageWidth + (topLeft.x + i)];

          backgroundVolume[offset + j * width + i] = pixel;
        }
      }
    });

    promises.push(promise);

    imageIdIndex++;
  }

  return Promise.all(promises);
}
