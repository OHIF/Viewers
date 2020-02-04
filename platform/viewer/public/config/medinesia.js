window.config = {
  // default: '/'
  routerBasename: '/',
  whiteLabelling: {},
  extensions: [],
  showStudyList: true,
  filterQueryParam: false,
  servers: {
    dicomWeb: [
      {
        name: 'Medinesia',
        wadoUriRoot: 'https://api.staging.medinesia.id/dicom/wado',
        qidoRoot: 'https://api.staging.medinesia.id/dicom/rs',
        wadoRoot: 'https://api.staging.medinesia.id/dicom/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true
      }
    ]
  }
}
