import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const maxSize = 512;

export default function generatePDFReport(
  measurements,
  imageIdPerMeasurement,
  indications,
  diagnosis
) {
  debugger;

  const cornerstoneElement = document.createElement('div');
  cornerstoneElement.style.width = maxSize + 'px';
  cornerstoneElement.style.height = maxSize + 'px';
  cornerstone.enable(cornerstoneElement, { renderer: 'canvas' });

  debugger;

  for (let i = 0; i < measurements.length; i++) {
    const measurement = measurements[i];
    const imageId = imageIdPerMeasurement[i];

    const image = _generateImageForMeasurement(
      cornerstoneElement,
      measurement,
      imageId
    );
  }
}

function _generateImageForMeasurement(
  cornerstoneElement,
  measurement,
  imageId
) {
  return new Promise((resolve, reject) => {
    const imageLoadCallback = evt => {
      debugger;
      cornerstoneElement.removeEventListener(
        'cornerstoneimagerendered',
        imageLoadCallback
      );

      // Get the enabledElement from event data
      const eventData = evt.detail;
      const { enabledElement } = eventData;

      const { canvas } = enabledElement;
      const imageData = canvas.toDataURL('image/jpg', 1);

      debugger;

      const lnk = document.createElement('a');

      // The key here is to set the download attribute of the a tag
      lnk.download = 'image.jpg';

      // Convert canvas content to data-uri for link. When download
      // Attribute is set the content pointed to by link will be
      // Pushed as 'download' in HTML5 capable browsers
      lnk.href = imageData;

      // Create a 'fake' click-event to trigger the download
      if (document.createEvent) {
        const e = document.createEvent('MouseEvents');

        e.initMouseEvent(
          'click',
          true,
          true,
          window,
          0,
          0,
          0,
          0,
          0,
          false,
          false,
          false,
          false,
          0,
          null
        );

        lnk.dispatchEvent(e);
      } else if (lnk.fireEvent) {
        lnk.fireEvent('onclick');
      }
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
