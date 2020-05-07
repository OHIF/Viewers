import getDataSourcesModule from './getDataSourcesModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.default',
  getDataSourcesModule,
};
