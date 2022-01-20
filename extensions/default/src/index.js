import getDataSourcesModule from './getDataSourcesModule.js';
import getLayoutTemplateModule from './getLayoutTemplateModule.js';
import getPanelModule from './getPanelModule.js';
import getSopClassHandlerModule from './getSopClassHandlerModule.js';
import getHangingProtocolModule from './getHangingProtocolModule.js';
import getToolbarModule from './getToolbarModule.js';
import commandsModule from './commandsModule';
import id from './id.js';

// TODO -> Inject these from package.json at build time.
const version = '1.0.1';

export default {
  /**
   * Only two required properties. Should be a unique value across all extensions.
   */
  id,
  version,

  getDataSourcesModule,
  getHangingProtocolModule,
  getLayoutTemplateModule,
  getPanelModule,
  getSopClassHandlerModule,
  getToolbarModule,
  getCommandsModule({ servicesManager, commandsManager }) {
    return commandsModule({ servicesManager, commandsManager });
  },
};
