import cornerstone from 'cornerstone-core';
import { getToolState } from 'cornerstone-tools';

export default function getElementFromFirstImageId(firstImageId) {
  const enabledElements = cornerstone.getEnabledElements();

  for (let i = 0; i < enabledElements.length; i++) {
    const enabledElement = enabledElements[i];
    const { element } = enabledElement;
    const stackState = getToolState(element, 'stack');
    const stackData = stackState.data[0];
    const firstImageIdOfEnabledElement = stackData.imageIds[0];

    if (firstImageIdOfEnabledElement === firstImageId) {
      return element;
    }
  }
}
