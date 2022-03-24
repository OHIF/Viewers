import cornerstone from 'cornerstone-core';

async function createDicomVolume(imageIds) {
  let volumeBuffer = [];

  const imagePromises = imageIds.map(cornerstone.loadAndCacheImage);
  const images = await Promise.all(imagePromises);

  for (let i = 0; i < imageIds.length; i++) {
    // const image = cornerstone.imageCache.imageCache[imageIds[i]];
    // const imageByteArray = image.image.data.byteArray;
    const imageByteArray = images[i].data.byteArray;
    const imageBlob = new Blob([imageByteArray],
      { type: 'application/octet-stream' });
    volumeBuffer.push({
      data: imageBlob,
      name: `image_${i}.dcm`,
    });
  }

  return volumeBuffer;
}

export default createDicomVolume;
