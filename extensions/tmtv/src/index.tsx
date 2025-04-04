import { id } from './id';
import getHangingProtocolModule from './getHangingProtocolModule';
import getPanelModule from './getPanelModule';
import init from './init';
import commandsModule from './commandsModule';
import getToolbarModule from './getToolbarModule';

/**
 *
 */
const tmtvExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  preRegistration({ servicesManager, commandsManager, extensionManager, configuration = {} }) {
    init({ servicesManager, commandsManager, extensionManager, configuration });
  },
  getToolbarModule,
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
