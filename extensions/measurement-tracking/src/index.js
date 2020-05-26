import getCommandsModule from './getCommandsModule.js';
import getContextModule from './getContextModule.js';
import getPanelModule from './getPanelModule.js';
import getViewportModule from './getViewportModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.measurement-tracking',
  getCommandsModule,
  getContextModule,
  getPanelModule,
  getViewportModule,
};
