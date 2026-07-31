/** @type {AppTypes.Config} */
// Local development configuration ONLY.
// Deployed environments use config/dev.js, config/qa.js or config/prod.js
// (selected via the APP_CONFIG build arg / env variable).
const { baseConfig, getDynamicDataSources } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/default.js',
  defaultDataSourceName: 'SANDBOX',
  dangerouslyUseDynamicConfig: {
    enabled: true,
    // Only allow config URLs from trusted deemea.com subdomains or localhost (dev)
    regex:
      /(https:\/\/[a-zA-Z0-9-]+\.deemea\.com(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)|(http:\/\/localhost(:[0-9]+)?(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)*)/,
  },
  dataSources: getDynamicDataSources({
    SANDBOX: 'http://localhost:5020/v1/didier',
    DICOMWEB: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
  }),
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    // console.warn(error.status);
    // Could use services manager here to bring up a dialog/modal if needed.
  },
};
