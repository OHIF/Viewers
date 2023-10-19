function addExtensionToConfigJson(pluginConfig, { packageName, version }) {
  addToList('extensions', pluginConfig, { packageName, version });
}

function addModeToConfigJson(pluginConfig, { packageName, version }) {
  addToList('modes', pluginConfig, { packageName, version });
}

function removeExtensionFromConfigJson(pluginConfig, { packageName }) {
  removeFromList('extensions', pluginConfig, { packageName });
}

function removeModeFromConfigJson(pluginConfig, { packageName }) {
  removeFromList('modes', pluginConfig, { packageName });
}

function removeFromList(listName, pluginConfig, { packageName }) {
  const list = pluginConfig[listName];

  const indexOfExistingEntry = list.findIndex(entry => entry.packageName === packageName);

  if (indexOfExistingEntry !== -1) {
    pluginConfig[listName].splice(indexOfExistingEntry, 1);
  }
}

function addToList(listName, pluginConfig, { packageName, version }) {
  removeFromList(listName, pluginConfig, { packageName });

  pluginConfig[listName].push({ packageName, version });
}

export {
  addExtensionToConfigJson,
  addModeToConfigJson,
  removeExtensionFromConfigJson,
  removeModeFromConfigJson,
};
