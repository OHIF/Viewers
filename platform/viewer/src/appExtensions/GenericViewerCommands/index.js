import commandsModule from './commandsModule.js';

export default {
  id: 'generic-viewer-commands',
  getCommandsModule() {
    return commandsModule;
  },
};
