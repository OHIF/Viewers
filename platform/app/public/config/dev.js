/** @type {AppTypes.Config} */
// Development environment configuration.
// Built with: APP_CONFIG=config/dev.js
const { baseConfig, createDataSources } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/dev.js',
  defaultDataSourceName: 'DEV_SANTY',
  dangerouslyUseDynamicConfig: {
    enabled: false,
  },
  dataSources: createDataSources({
    SANDBOX: 'https://sandbox.deemea.com/api/v1/didier',
    SANDBOX_V2: 'https://sandbox.dev.deemea.com/api/v1/didier',
    DEV_SANTY: 'https://santy-dev.deemea.com/api/v1/didier',
    DEV_F4C: 'https://dev.f4c.deemea.com/api/v1/didier',
  }),
};
