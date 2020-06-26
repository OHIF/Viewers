import {
  getToolState,
  globalImageIdSpecificToolStateManager,
  importInternal,
} from 'cornerstone-tools';

const scrollToIndex = importInternal('util/scrollToIndex');

/**
 * Jumps to annotation with the newId and sets it active.
 * Sets the measurement with the oldId inactive.
 *
 * @param {string} oldId The old measurementId to set inactive.
 * @param {string} newId The new measurementId to set active.
 * @param {HTMLElement} element The cornerstone enabled element.
 */
export default function jumpToNextAnnotation(oldId, newId, element) {
  const stack = getToolState(element, 'stack');

  if (!stack || !stack.data) {
    return;
  }

  const imageIds = stack.data[0].imageIds;
  const imageIdIndex = _getImageIdIndexAndSetToolActive(imageIds, oldId, newId);

  if (imageIdIndex === undefined) {
    return;
  }

  scrollToIndex(element, imageIdIndex);

  cornerstone.updateImage(element);
}

/**
 * Finds the imageIdIndex in the stack of the measuremnt with the newId.
 * Sets the measurement with the oldId as innactive.
 *
 * @param {string[]} imageIds The cornerstone imageIds in the stack.
 * @param {string} oldId
 * @param {string} newId
 */
function _getImageIdIndexAndSetToolActive(imageIds, oldId, newId) {
  const toolState = globalImageIdSpecificToolStateManager.saveToolState();
  let foundOldId = oldId ? false : true; // If no oldId, don't need to check it
  let foundNewId = false;

  // Search through the stacks imageId for the annotation.
  // Jump out immediately when we find it.

  let newImageIdIndex;

  for (let imageIdIndex = 0; imageIdIndex < imageIds.length; imageIdIndex++) {
    const imageId = imageIds[imageIdIndex];
    const imageIdSpecificToolState = toolState[imageId];

    if (!imageIdSpecificToolState) {
      continue;
    }

    const toolTypes = Object.keys(imageIdSpecificToolState);

    for (let j = 0; j < toolTypes.length; j++) {
      const toolType = toolTypes[j];
      const toolData = imageIdSpecificToolState[toolType].data;

      if (toolData) {
        if (!foundOldId) {
          const oldData = toolData.find(td => td.id === oldId);

          if (oldData) {
            oldData.active = false;
            foundOldId = true;
          }
        }

        if (!foundNewId) {
          const newData = toolData.find(td => td.id === newId);

          if (newData) {
            newImageIdIndex = imageIdIndex;
            newData.active = true;
            foundNewId = true;
          }
        }

        if (foundOldId && foundNewId) {
          return newImageIdIndex;
        }
      }
    }
  }
}
