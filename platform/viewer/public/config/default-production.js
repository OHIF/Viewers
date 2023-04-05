window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: false,
  healthcareApiEndpoint: 'https://healthcare.googleapis.com/v1',
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [
      {
        wadoUriRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-prod-b09f/locations/us/datasets/mib-air-dicom-dataset/dicomStores/mib-air-dicom-datastore/dicomWeb',
        qidoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-prod-b09f/locations/us/datasets/mib-air-dicom-dataset/dicomStores/mib-air-dicom-datastore/dicomWeb',
        wadoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-mib-air-prod-b09f/locations/us/datasets/mib-air-dicom-dataset/dicomStores/mib-air-dicom-datastore/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
  // This is an array, but we'll only use the first entry for now
  studyListFunctionsEnabled: true,
};
