import { HotkeysManager } from 'ohif-core';
import store from './store';

function initialize() {
  // binding, method,
  const numHotkeys = hotkeyConfig.length;
  for (let i = 0; i < numHotkeys; i++) {
    const { keys, actionName, actionContexts, options } = hotkeyConfig[i];
    const action = actions[actionName];

    Mousetrap.bind(keys, () => {
      let actionParams = options;
      actionContexts.forEach(context => {
        actionParams[context] = store.getState()[context];
      });
      action(actionParams);
    });
  }

  const hotkeysPreferences = store.getState().preferences;
  const hotkeysViewerContext = hotkeysPreferences.viewer;
  const hotkeysData = hotkeysViewerContext.hotkeysData;

  Object.keys(hotkeysData).forEach(hotkeyName => {
    // context,
    const hotkeyCommandName = hotkeysData[hotkeyName];
    HotkeysManager.register();
  });
}

function clear() {
  HotkeysManager.clear();
}

export default {
  clear,
  initialize,
};
