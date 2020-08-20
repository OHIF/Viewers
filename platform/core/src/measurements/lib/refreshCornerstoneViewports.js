import cornerstone from 'cornerstone-core';

export default function refreshCornerstoneViewports() {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    if (enabledElement.image) {
      cornerstone.updateImage(enabledElement.element);
    }
  });
}
