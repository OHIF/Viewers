import cornerstone from 'cornerstone-core';

const waitForTheImageToBeRendered = enabledElement =>
  new Promise(resolve => {
    const onImageRenderedCallback = () => {
      enabledElement.removeEventListener(
        cornerstone.EVENTS.IMAGE_RENDERED,
        onImageRenderedCallback
      );
      resolve();
    };
    enabledElement.addEventListener(
      cornerstone.EVENTS.IMAGE_RENDERED,
      onImageRenderedCallback
    );
  });

export default waitForTheImageToBeRendered;
