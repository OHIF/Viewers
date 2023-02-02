import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const triggerEvent = cornerstoneTools.import('util/triggerEvent');

/**
 * Scrolls through the stack to the image index requested.
 * @export @public @method
 * @name scrollToIndex
 *
 * @param  {type} element         The element to scroll through.
 * @param  {type} newImageIdIndex The target image index.
 * @returns {void}
 */
export default function(element, newImageIdIndex) {
  const toolData = cornerstoneTools.getToolState(element, 'stack');

  if (!toolData || !toolData.data || !toolData.data.length) {
    return;
  }

  // If we have more than one stack, check if we have a stack renderer defined
  let stackRenderer;

  if (toolData.data.length > 1) {
    const stackRendererData = cornerstoneTools.getToolState(
      element,
      'stackRenderer'
    );

    if (
      stackRendererData &&
      stackRendererData.data &&
      stackRendererData.data.length
    ) {
      stackRenderer = stackRendererData.data[0];
    }
  }

  const stackData = toolData.data[0];

  // Allow for negative indexing
  if (newImageIdIndex < 0) {
    newImageIdIndex += stackData.imageIds.length;
  }

  const startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler(
    element
  );
  const endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler(
    element
  );
  const errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler(
    element
  );

  function doneCallback(image) {
    if (stackData.currentImageIdIndex !== newImageIdIndex) {
      return;
    }

    // Check if the element is still enabled in Cornerstone,
    // If an error is thrown, stop here.
    try {
      // TODO: Add 'isElementEnabled' to Cornerstone?
      cornerstone.getEnabledElement(element);
    } catch (error) {
      return;
    }

    if (stackRenderer) {
      stackRenderer.currentImageIdIndex = newImageIdIndex;
      stackRenderer.render(element, toolData.data);
    } else {
      cornerstone.displayImage(element, image);
    }

    if (endLoadingHandler) {
      endLoadingHandler(element, image);
    }
  }

  function failCallback(error) {
    const imageId = stackData.imageIds[newImageIdIndex];

    if (errorLoadingHandler) {
      errorLoadingHandler(element, imageId, error);
    }
  }

  if (newImageIdIndex === stackData.currentImageIdIndex) {
    return;
  }

  if (startLoadingHandler) {
    startLoadingHandler(element);
  }

  const eventData = {
    newImageIdIndex,
    direction: newImageIdIndex - stackData.currentImageIdIndex,
  };

  stackData.currentImageIdIndex = newImageIdIndex;
  const newImageId = stackData.imageIds[newImageIdIndex];

  // Retry image loading in cases where previous image promise
  // Was rejected, if the option is set
  /*

    Const config = stackScroll.getConfiguration();

    TODO: Revisit this. It appears that Core's imageCache is not
    keeping rejected promises anywhere, so we have no way to know
    if something was previously rejected.

    if (config && config.retryLoadOnScroll === true) {
    }
  */

  // Convert the preventCache value in stack data to a boolean
  const preventCache = Boolean(stackData.preventCache);

  let imagePromise;

  if (preventCache) {
    imagePromise = cornerstone.loadImage(newImageId);
  } else {
    imagePromise = cornerstone.loadAndCacheImage(newImageId);
  }

  imagePromise.then(doneCallback, failCallback);

  triggerEvent(element, cornerstoneTools.EVENTS.STACK_SCROLL, eventData);
}
