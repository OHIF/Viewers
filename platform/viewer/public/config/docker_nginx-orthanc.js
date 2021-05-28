window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  dataSources: [
    {
      friendlyName: 'Orthanc Server',
      namespace: 'org.ohif.default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'Orthanc',
        wadoUriRoot: '/wado',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
};
