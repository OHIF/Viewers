import { redux, utils } from '@ohif/core';
import store from './../../store';
const { setViewportActive, setActiveViewportSpecificData } = redux.actions;

const actions = {
  updateActiveViewport: ({ viewports, direction }) => {
    const { viewportSpecificData, activeViewportIndex } = viewports;
    const maxIndex = Object.keys(viewportSpecificData).length - 1;

    let newIndex = activeViewportIndex + direction;
    newIndex = newIndex > maxIndex ? 0 : newIndex;
    newIndex = newIndex < 0 ? maxIndex : newIndex;

    store.dispatch(setViewportActive(newIndex));
  },
  updateViewportDisplaySet: ({ viewports, direction }) => {
    const viewportSpecificData = { ...viewports.viewportSpecificData };
    const activeViewport = viewportSpecificData[viewports.activeViewportIndex];
    const studyMetadata = utils.studyMetadataManager.get(
      activeViewport.studyInstanceUid
    );

    if (!studyMetadata) {
      return;
    }

    const allDisplaySets = studyMetadata.getDisplaySets();
    const currentDisplaySetIndex = allDisplaySets.findIndex(
      displaySet =>
        displaySet.displaySetInstanceUid ===
        activeViewport.displaySetInstanceUid
    );
    if (currentDisplaySetIndex < 0) {
      return;
    }

    const newDisplaySetIndex = currentDisplaySetIndex + direction;
    const newDisplaySetData = allDisplaySets[newDisplaySetIndex];
    if (!newDisplaySetData) {
      return;
    }

    store.dispatch(setActiveViewportSpecificData(newDisplaySetData));
  },
};

const definitions = {
  // Next/Previous active viewport
  incrementActiveViewport: {
    commandFn: actions.updateActiveViewport,
    storeContexts: ['viewports'],
    options: { direction: 1 },
  },
  decrementActiveViewport: {
    commandFn: actions.updateActiveViewport,
    storeContexts: ['viewports'],
    options: { direction: -1 },
  },
  nextViewportDisplaySet: {
    commandFn: actions.updateViewportDisplaySet,
    storeContexts: ['viewports'],
    options: { direction: 1 },
  },
  previousViewportDisplaySet: {
    commandFn: actions.updateViewportDisplaySet,
    storeContexts: ['viewports'],
    options: { direction: -1 },
  },
};

export default {
  definitions,
  defaultContext: 'VIEWER',
};
