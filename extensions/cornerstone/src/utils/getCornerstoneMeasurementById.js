import cornerstoneTools from 'cornerstone-tools';

const { globalImageIdSpecificToolStateManager } = cornerstoneTools;

export default function getCornerstoneMeasurementById(id) {
  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();

  const imageIds = Object.keys(globalToolState);

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageIdSpecificToolState = globalToolState[imageId];

    const toolTypes = Object.keys(imageIdSpecificToolState);

    for (let j = 0; j < toolTypes.length; j++) {
      const toolType = toolTypes[j];
      const toolData = imageIdSpecificToolState[toolType].data;

      if (toolData) {
        for (let k = 0; k < toolData.length; k++) {
          const toolDataK = toolData[k];

          if (toolDataK.id === id) {
            return toolDataK;
          }
        }
      }
    }
  }
}
