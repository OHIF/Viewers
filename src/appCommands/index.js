import viewerCommandDefinitions from './viewer.js';

const CONTEXTS = {
  viewer: 'VIEWER',
};

/**
 * Register all commands.
 * TODO: Extensions should self-register their commands
 */
function init(commandsManager) {
  _registerViewerCommands(commandsManager);
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

export default {
  init,
};
