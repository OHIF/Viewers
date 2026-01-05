/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  
  // Optimizaciones básicas
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  
  // DataSource por defecto
  defaultDataSourceName: 'dicomweb',

  // --- AUTENTICACIÓN (Rutas Relativas) ---
  // '/auth/' será capturado por Nginx y enviado a Keycloak
  oidc: [
    {
      authority: '/auth/realms/dcm4che', 
      client_id: 'ohif-viewer',
      redirect_uri: '/callback',
      response_type: 'code',
      scope: 'openid',
      post_logout_redirect_uri: '/',
      revoke_access_token_on_logout: true,
    },
  ],

  // --- FUENTES DE DATOS (Rutas Relativas) ---
  // '/dcm4chee-arc/' será capturado por Nginx y enviado al PACS
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'DCM4CHEE Proxy',
        name: 'DCM4CHEE',
        
        // Rutas relativas
        wadoUriRoot: '/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: '/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: '/dcm4chee-arc/aets/DCM4CHEE/rs',
        
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
        
        singlepart: 'video', 
        bulkDataURI: {
            enabled: true,
        },
      },
    },
    {
        namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
        sourceName: 'dicomjson',
        configuration: { friendlyName: 'dicom json', name: 'json' },
    },
    {
        namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
        sourceName: 'dicomlocal',
        configuration: { friendlyName: 'dicom local' },
    },
  ],
};