/** @type {AppTypes.Config} */
// Production environment configuration.
// Built with: APP_CONFIG=config/prod.js
const { baseConfig, createDataSources } = window.deemeaConfig;

window.config = {
  ...baseConfig,
  name: 'config/prod.js',
  defaultDataSourceName: 'dicomweb',
  // No dynamic config in production (reduces attack surface)
  dangerouslyUseDynamicConfig: {
    enabled: false,
  },
  dataSources: createDataSources({
    STRAUBING: { url: 'https://straubing.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    MERMOZ: { url: 'https://mermoz.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    ERASME: { url: 'https://erasme.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    LARIBOISIERE_SAAS: { url: 'https://lariboisiere-saas.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    TRICASE: { url: 'https://tricase.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    DUBOIS: { url: 'https://dubois.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    RENACOT: { url: 'https://renacot.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    PROD_SANTY: { url: 'https://santy-prod.deemea.com/api/v1/didier', qidoSupportsIncludeField: true, supportsReject: true },
    FRANCE_IMAGERIE: 'https://france-imagerie.deemea.com/api/v1/didier',
    EVESIO: 'https://evesio.deemea.com/api/v1/didier',
    CHU_TOURS: 'https://deemea-prod.chu-tours.fr/api/v1/didier',
    CHU_TOURS_SAAS: 'https://chu-tours-saas.deemea.com/api/v1/didier',
    RADYON: 'https://radyon.deemea.com/api/v1/didier',
    PROD_F4C: 'https://prod.f4c.deemea.com/api/v1/didier',
  }),
};
