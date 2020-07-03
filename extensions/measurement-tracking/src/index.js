import getContextModule from './getContextModule.js';
import getPanelModule from './getPanelModule.js';
import getViewportModule from './getViewportModule.js';
import getOnSwitchModeRouteModule from './getOnSwitchModeRouteModule';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.measurement-tracking',
  getContextModule,
  getPanelModule,
  getViewportModule,
  getOnSwitchModeRouteModule,
};
