window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: false,
  healthcareApiEndpoint: 'https://healthcare.googleapis.com/v1',
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [
      {
        wadoUriRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-dev-2a0b/locations/us/datasets/mib-air-dicom-dataset-dev/dicomStores/mib-air-dicom-datastore-dev/dicomWeb',
        qidoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-dev-2a0b/locations/us/datasets/mib-air-dicom-dataset-dev/dicomStores/mib-air-dicom-datastore-dev/dicomWeb',
        wadoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-dev-2a0b/locations/us/datasets/mib-air-dicom-dataset-dev/dicomStores/mib-air-dicom-datastore-dev/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
  // This is an array, but we'll only use the first entry for now
  studyListFunctionsEnabled: true,
};
