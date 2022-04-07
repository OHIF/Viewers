import { redux } from '@ohif/core';
import store from './../../store';

const commandsModule = ({ commandsManager }) => {
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
    setWindowLevelPreset: ({ viewports, preset }) => {
      const state = store.getState();
      const { preferences = {} } = state;
      const { window, level } =
        preferences.windowLevelData && preferences.windowLevelData[preset];

      if (window && level) {
        commandsManager.runCommand('setWindowLevel', {
          viewports,
          window,
          level,
        });
      }
    },
    updateViewportDisplaySet: ({ viewports, direction }) => {
      const viewportSpecificData = { ...viewports.viewportSpecificData };
      const activeViewport =
        viewportSpecificData[viewports.activeViewportIndex];
      const studyMetadata = utils.studyMetadataManager.get(
        activeViewport.StudyInstanceUID
      );

      if (!studyMetadata) {
        return;
      }

      const allDisplaySets = studyMetadata.getDisplaySets();
      const currentDisplaySetIndex = allDisplaySets.findIndex(
        displaySet =>
          displaySet.displaySetInstanceUID ===
          activeViewport.displaySetInstanceUID
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
    // Window level Presets
    windowLevelPreset1: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 1 },
    },
    windowLevelPreset2: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 2 },
    },
    windowLevelPreset3: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 3 },
    },
    windowLevelPreset4: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 4 },
    },
    windowLevelPreset5: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 5 },
    },
    windowLevelPreset6: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 6 },
    },
    windowLevelPreset7: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 7 },
    },
    windowLevelPreset8: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 8 },
    },
    windowLevelPreset9: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 9 },
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

  return {
    definitions,
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
