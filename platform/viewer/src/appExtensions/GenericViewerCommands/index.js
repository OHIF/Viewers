import commandsModule from './commandsModule.js';

export default {
  id: 'generic-viewer-commands',
  get version() {
    return window.version;
  },
  getCommandsModule({ commandsManager }) {
    return commandsModule({ commandsManager });
  },
};
