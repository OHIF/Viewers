/** @type {AppTypes.Config} */

// OHIF app config for this deployment. `docker compose up` (see README.md)
// passes this file's text through the stock image's APP_CONFIG entrypoint.
//
// Point the data source at your own DICOMweb server; the one below is OHIF's
// read-only public demo server.
window.config = {
  name: 'config/app-config.js',
  routerBasename: null,
  showStudyList: true,
  // Runtime-loaded plugin descriptors go here: prebuilt UMD bundles served
  // under /plugins/ (see the optional volume in docker-compose.yml and the
  // descriptor example in README.md).
  extensions: [],
  modes: [],
  customizationService: {},
  defaultDataSourceName: 'ohif',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ohif',
      configuration: {
        friendlyName: 'AWS S3 Static wado server',
        name: 'aws',
        wadoUriRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'thumbnail',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
};
