const state = {
  // The `defaultContext` of an extension's commandsModule
  DEFAULT_CONTEXT: 'ACTIVE_VIEWPORT::CORNERSTONE',
  enabledElements: {},
};

/**
 * Sets the enabled element `dom` reference for an active viewport.
 * @param {HTMLElement} dom Active viewport element.
 * @return void
 */
const setEnabledElement = (viewportIndex, element, context) => {
  const targetContext = context || DEFAULT_CONTEXT;

  state.enabledElements[viewportIndex] = {
    element,
    context: targetContext,
  };
};

/**
 * Grabs the enabled element `dom` reference of an adective viewport.
 *
 * @return {HTMLElement} Active viewport element.
 */
const getEnabledElement = viewportIndex => {
  return state.enabledElements[viewportIndex];
};

export { setEnabledElement, getEnabledElement };
