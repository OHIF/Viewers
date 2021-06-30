import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const { globalImageIdSpecificToolStateManager } = cornerstoneTools;

export default function setCornerstoneMeasurementActive(measurement) {
  const { id } = measurement;

  const toolState = globalImageIdSpecificToolStateManager.saveToolState();

  Object.keys(toolState).forEach(imageId => {
    const imageIdSpecificToolState = toolState[imageId];

    Object.keys(imageIdSpecificToolState).forEach(toolType => {
      const toolSpecificToolState = imageIdSpecificToolState[toolType];

      const toolSpecificToolData = toolSpecificToolState.data;

      if (toolSpecificToolData && toolSpecificToolData.length) {
        toolSpecificToolData.forEach(data => {
          data.active = data.id === id ? true : false;
        });
      }
    });
  });

  const enabledElements = cornerstoneTools.store.state.enabledElements;

  enabledElements.forEach(element => {
    try {
      cornerstone.updateImage(element);
    } catch (ex) {
      // https://github.com/cornerstonejs/cornerstone/blob/master/src/updateImage.js#L16
      // This fails if enabledElement.image is undefined and we have no layers
      // Instead of throwing, it should _probably_ do nothing.
      // We'll just swallow the exception
    }
  });
}
