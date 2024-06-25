window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  dataSources: [
    {
      friendlyName: 'Orthanc local',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'orthanc',

        wadoUriRoot: '/orthanc/dicom-web',
        qidoRoot: '/orthanc/dicom-web',
        wadoRoot: '/orthanc/dicom-web',

        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
          // This is an example config that could potentially be used to fix the retrieve URL
          startsWith: 'http://localhost/',
          prefixWith: '/orthanc/',
        },
        acceptHeader: ['multipart/related; type=application/octet-stream; transfer-syntax=*']
      },
    }],
  defaultDataSourceName: 'dicomweb',
};
