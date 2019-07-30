window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: 'http://127.0.0.1/pacs/wado',
        qidoRoot: 'http://127.0.0.1/pacs/dicom-web',
        wadoRoot: 'http://127.0.0.1/pacs/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        // REQUIRED TAG:
        // https://github.com/OHIF/ohif-core/blob/59e1e04b92be24aee5d4402445cb3dcedb746995/src/studies/retrieveStudyMetadata.js#L54
        // TODO: Remove tag after https://github.com/OHIF/ohif-core/pull/19 is merged and we bump version
        requestOptions: {
          // undefined to use JWT + Bearer auth
          // auth: 'orthanc:orthanc',
          requestFromBrowser: true,
        },
      },
    ],
  },
}
