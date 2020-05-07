import getContextModule from './getContextModule.js';
import getDataSourcesModule from './getDataSourcesModule.js';
import getLayoutTemplatesModule from './getLayoutTemplatesModule.js';
import getSidePanelModule from './getSidePanelModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.default',
  getContextModule,
  getDataSourcesModule,
  getLayoutTemplatesModule,
  getSidePanelModule,
};
