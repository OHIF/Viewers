import { CommandsManager } from 'ohif-core';
import cornerstoneCommandDefinitions from 'cornerstone.js';
import viewerCommandDefinitions from 'viewer.js';

const CONTEXTS = {
  viewer: 'VIEWER',
  cornerstone: 'VIEWER::CORNERSTONE',
};

/**
 * Register all commands
 */
function init() {
  _registerViewerCommands();
  _registerCornerstoneCommands();
}

/**
 * Register all Viewer commands
 *
 * @private
 */
function _registerViewerCommands() {
  const commandContext = CONTEXTS.viewer;

  CommandsManager.createContext(commandContext);
  Object.keys(viewerCommandDefinitions).forEach(commandName => {
    const commandDefinition = viewerCommandDefinitions[commandName];

    CommandsManager.register(commandContext, commandName, commandDefinition);
  });
}

/**
 * Register all Cornerstone commands
 *
 * @private
 */
function _registerCornerstoneCommands() {
  const commandContext = CONTEXTS.cornerstone;

  CommandsManager.createContext(commandContext);
  Object.keys(cornerstoneCommandDefinitions).forEach(commandName => {
    const commandDefinition = cornerstoneCommandDefinitions[commandName];

    CommandsManager.register(commandContext, commandName, commandDefinition);
  });
}

export default {
  init,
};
