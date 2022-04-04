import getDataSourcesModule from './getDataSourcesModule.js';
import getLayoutTemplateModule from './getLayoutTemplateModule.js';
import getPanelModule from './getPanelModule.js';
import getSopClassHandlerModule from './getSopClassHandlerModule.js';
import getHangingProtocolModule from './getHangingProtocolModule.js';
import getToolbarModule from './getToolbarModule.js';
import commandsModule from './commandsModule';
import { id, version } from './id.js';

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
