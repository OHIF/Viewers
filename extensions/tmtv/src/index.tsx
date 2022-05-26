import { id } from './id';
import getHangingProtocolModule from './getHangingProtocolModule';
import getPanelModule from './getPanelModule';
import init from './init';
import commandsModule from './commandsModule';

/**
 *
 */
const tmtvExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },
  getPanelModule,
  getHangingProtocolModule,
  getCommandsModule({ servicesManager, commandsManager, extensionManager }) {
    return commandsModule({
      servicesManager,
      commandsManager,
      extensionManager,
    });
  },
};

export default tmtvExtension;
