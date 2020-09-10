import cornerstone from 'cornerstone-core';

const maxSize = 512;

export default async function generateScreenshots(
  measurements,
  imageIdPerMeasurement
) {
  debugger;
  const cornerstoneElement = document.createElement('div');
  cornerstoneElement.style.width = maxSize + 'px';
  cornerstoneElement.style.height = maxSize + 'px';
  cornerstone.enable(cornerstoneElement, { renderer: 'canvas' });

  const enabledElement = cornerstone.getEnabledElement(cornerstoneElement);

  const { canvas } = enabledElement;

  canvas.width = maxSize;
  canvas.height = maxSize;

  const images = [];

  for (let i = 0; i < measurements.length; i++) {
    const measurement = measurements[i];
    const { measurementNumber } = measurement;
    const imageId = imageIdPerMeasurement[i];

    const image = await _generateImageForMeasurement(
      cornerstoneElement,
      imageId
    );

    images.push({ measurementNumber, image });
  }

  cornerstone.disable(cornerstoneElement);

  return images;
}

function _generateImageForMeasurement(cornerstoneElement, imageId) {
  return new Promise((resolve, reject) => {
    const imageLoadCallback = evt => {
      cornerstoneElement.removeEventListener(
        'cornerstoneimagerendered',
        imageLoadCallback
      );

      // Get the enabledElement from event data
      const eventData = evt.detail;
      const { enabledElement } = eventData;

      const { canvas } = enabledElement;
      const imageData = canvas.toDataURL('image/jpg', 1);

      resolve(imageData);
    };

    cornerstone.loadImage(imageId).then(image => {
      cornerstoneElement.addEventListener(
        'cornerstoneimagerendered',
        imageLoadCallback
      );
      cornerstone.displayImage(cornerstoneElement, image);
    });
  });
}
