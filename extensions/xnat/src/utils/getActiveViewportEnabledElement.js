/**
 * Grabs `dom` reference for the enabledElement of
 * the active viewport
 */
export default function getActiveViewportEnabledElement(
  viewports,
  activeIndex
) {
  const activeViewport = viewports[activeIndex] || {};

  return activeViewport.dom;
}
