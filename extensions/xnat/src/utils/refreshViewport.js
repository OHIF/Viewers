import cornerstone from 'cornerstone-core';

export default function refreshViewport() {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
}