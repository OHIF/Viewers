const state = {
  enabledElement: null,
};

/**
 * Grabs the `dom` reference for the enabledElement of the active viewport.
 * @param {HTMLElement} dom Active viewport element.
 * @return void
 */
const setEnabledElement = element => (state.enabledElement = element);

/**
 * Grabs the `dom` reference for the enabledElement of the active viewport.
 *
 * @return {HTMLElement} Active viewport element.
 */
const getEnabledElement = () => state.enabledElement;

export { setEnabledElement, getEnabledElement };
