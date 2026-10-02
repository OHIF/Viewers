/** @type {AppTypes.Config} */

// Workspace app config. `pnpm dev` / `pnpm build` sync this file into the
// harness as config/workspace.js, so edits here reach the running viewer.
//
// Point the data source at your own DICOMweb server; the one below is OHIF's
// read-only public demo server.
window.config = {
  name: 'config/app-config.js',
  routerBasename: null,
  showStudyList: true,
  // Runtime-loaded plugin descriptors (prebuilt UMD bundles served under
  // /plugins/) are declared here. Workspace plugins listed in ohif.config.json
  // do NOT need descriptors -- the harness compiles them from source.
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
