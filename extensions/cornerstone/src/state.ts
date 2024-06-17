const state = {
  // The `defaultContext` of an extension's commandsModule
  DEFAULT_CONTEXT: 'CORNERSTONE',
  enabledElements: {},
};

/**
 * Sets the enabled element `dom` reference for an active viewport.
 * @param {HTMLElement} dom Active viewport element.
 * @return void
 */
const setEnabledElement = (viewportId: string, element: HTMLElement, context?: string): void => {
  const targetContext = context || state.DEFAULT_CONTEXT;

  state.enabledElements[viewportId] = {
    element,
    context: targetContext,
  };
};

/**
 * Grabs the enabled element `dom` reference of an active viewport.
 *
 * @return {HTMLElement} Active viewport element.
 */
const getEnabledElement = viewportId => {
  return state.enabledElements[viewportId];
};

const reset = () => {
  state.enabledElements = {};
};

export { setEnabledElement, getEnabledElement, reset };
