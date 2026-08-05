/** @type {AppTypes.Config} */
// QA environment configuration.
// Built with: APP_CONFIG=config/qa.js
const { baseConfig, getDynamicDataSources } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/qa.js',
  defaultDataSourceName: 'CLOUD_QA',
  dangerouslyUseDynamicConfig: {
    enabled: false,
  },
  dataSources: getDynamicDataSources({
    CLOUD_QA: 'https://cloud-qa.deemea.com/api/v1/didier',
    GPU_QA: 'https://gpu.qa.deemea.com/api/v1/didier',
    SANTY: 'https://santy-qa.deemea.com/api/v1/didier',
    QA_F4C: 'https://qa.f4c.deemea.com/api/v1/didier',
  }),
};
