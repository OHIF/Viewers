export default function refreshViewports() {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
}
