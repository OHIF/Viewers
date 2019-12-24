import { redux } from "@ohif/core";
import store from "./../../store";
const { setViewportActive } = redux.actions;

const actions = {
  updateViewportDisplaySet: ({ direction }) => {
    // TODO
    // console.warn('updateDisplaySet: ', direction);
  },
  updateActiveViewport: ({ viewports, direction }) => {
    const { viewportSpecificData, activeViewportIndex } = viewports;
    const maxIndex = Object.keys(viewportSpecificData).length - 1;

    let newIndex = activeViewportIndex + direction;
    newIndex = newIndex > maxIndex ? 0 : newIndex;
    newIndex = newIndex < 0 ? maxIndex : newIndex;

    store.dispatch(setViewportActive(newIndex));
  }
};

const definitions = {
  // Next/Previous active viewport
  incrementActiveViewport: {
    commandFn: actions.updateActiveViewport,
    storeContexts: ["viewports"],
    options: { direction: 1 }
  },
  decrementActiveViewport: {
    commandFn: actions.updateActiveViewport,
    storeContexts: ["viewports"],
    options: { direction: -1 }
  }
};

export default {
  definitions,
  defaultContext: "VIEWER"
};
