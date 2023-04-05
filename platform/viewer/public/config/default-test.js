window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: false,
  healthcareApiEndpoint: 'https://healthcare.googleapis.com/v1',
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [
      {
        wadoUriRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-qa-d103/locations/us/datasets/mib-air-dicom-dataset-test/dicomStores/mib-air-dicom-datastore-test/dicomWeb',
        qidoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-qa-d103/locations/us/datasets/mib-air-dicom-dataset-test/dicomStores/mib-air-dicom-datastore-test/dicomWeb',
        wadoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-qa-d103/locations/us/datasets/mib-air-dicom-dataset-test/dicomStores/mib-air-dicom-datastore-test/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
  // This is an array, but we'll only use the first entry for now
  studyListFunctionsEnabled: true,
};
