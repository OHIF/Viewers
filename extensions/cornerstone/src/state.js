const state = {
  enabledElements: {},
};

/**
 * Sets the `dom` reference for the enabledElement of an active viewport.
 * @param {HTMLElement} dom Active viewport element.
 * @return void
 */
const setEnabledElement = (viewportIndex, element) =>
  (state.enabledElements[viewportIndex] = element);

/**
 * Grabs the `dom` reference for the enabledElement of an active viewport.
 *
 * @return {HTMLElement} Active viewport element.
 */
const getEnabledElement = viewportIndex => state.enabledElements[viewportIndex];

export { setEnabledElement, getEnabledElement };
