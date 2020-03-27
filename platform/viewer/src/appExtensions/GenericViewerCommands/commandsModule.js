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
      label: 'Next Viewport',
      keys: ['right'],
    },
    decrementActiveViewport: {
      commandFn: actions.updateActiveViewport,
      storeContexts: ['viewports'],
      options: { direction: -1 },
      label: 'Previous Viewport',
      keys: ['left'],
    },
    // Window level Presets
    windowLevelPreset1: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 1 },
      label: 'W/L Preset 1',
      keys: ['1'],
    },
    windowLevelPreset2: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 2 },
      label: 'W/L Preset 2',
      keys: ['2'],
    },
    windowLevelPreset3: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 3 },
      label: 'W/L Preset 3',
      keys: ['3'],
    },
    windowLevelPreset4: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 4 },
      label: 'W/L Preset 4',
      keys: ['4'],
    },
    windowLevelPreset5: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 5 },
      label: 'W/L Preset 5',
      keys: ['5'],
    },
    windowLevelPreset6: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 6 },
      label: 'W/L Preset 6',
      keys: ['6'],
    },
    windowLevelPreset7: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 7 },
      label: 'W/L Preset 7',
      keys: ['7'],
    },
    windowLevelPreset8: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 8 },
      label: 'W/L Preset 8',
      keys: ['8'],
    },
    windowLevelPreset9: {
      commandFn: actions.setWindowLevelPreset,
      storeContexts: ['viewports'],
      options: { preset: 9 },
      label: 'W/L Preset 9',
      keys: ['9'],
    },
    nextViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
      storeContexts: ['viewports'],
      options: { direction: 1 },
      label: 'Next Series',
      keys: ['pageup'],
    },
    previousViewportDisplaySet: {
      commandFn: actions.updateViewportDisplaySet,
      storeContexts: ['viewports'],
      options: { direction: -1 },
      label: 'Previous Series',
      keys: ['pagedown'],
    },
  };

  return {
    definitions,
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
