import cornerstoneCommandDefinitions from './cornerstone.js';
import viewerCommandDefinitions from './viewer.js';

const CONTEXTS = {
  viewer: 'VIEWER',
  cornerstone: 'VIEWER::CORNERSTONE',
};

/**
 * Register all commands.
 * TODO: Extensions should self-register their commands
 */
function init(commandsManager) {
  _registerViewerCommands(commandsManager);
  _registerCornerstoneCommands(commandsManager);
}

/**
 * Register all Viewer commands
 *
 * @private
 */
function _registerViewerCommands(commandsManager) {
  const commandContext = CONTEXTS.viewer;

  commandsManager.createContext(commandContext);
  Object.keys(viewerCommandDefinitions).forEach(commandName => {
    const commandDefinition = viewerCommandDefinitions[commandName];

    commandsManager.registerCommand(
      commandContext,
      commandName,
      commandDefinition
    );
  });
}

/**
 * Register all Cornerstone commands
 *
 * @private
 */
function _registerCornerstoneCommands(commandsManager) {
  const commandContext = CONTEXTS.cornerstone;

  commandsManager.createContext(commandContext);
  Object.keys(cornerstoneCommandDefinitions).forEach(commandName => {
    const commandDefinition = cornerstoneCommandDefinitions[commandName];

    commandsManager.registerCommand(
      commandContext,
      commandName,
      commandDefinition
    );
  });
}

export default {
  init,
};
