import getContextModule from './getContextModule.js';
import getDataSourcesModule from './getDataSourcesModule.js';
import getLayoutTemplateModule from './getLayoutTemplateModule.js';
import getPanelModule from './getPanelModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.default',
  getContextModule,
  getDataSourcesModule,
  getLayoutTemplateModule,
  getPanelModule,
};
