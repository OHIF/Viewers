window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: false,
  healthcareApiEndpoint: 'https://healthcare.googleapis.com/v1',
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [
      {
        wadoUriRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-stage-88af/locations/us/datasets/mib-air-dicom-dataset-stage/dicomStores/mib-air-dicom-datastore-stage/dicomWeb',
        qidoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-stage-88af/locations/us/datasets/mib-air-dicom-dataset-stage/dicomStores/mib-air-dicom-datastore-stage/dicomWeb',
        wadoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-stage-88af/locations/us/datasets/mib-air-dicom-dataset-stage/dicomStores/mib-air-dicom-datastore-stage/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
  // This is an array, but we'll only use the first entry for now
  studyListFunctionsEnabled: true,
};
