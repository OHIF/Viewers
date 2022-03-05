window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: false,
  healthcareApiEndpoint: 'https://healthcare.googleapis.com/v1',
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [
      {
        wadoUriRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-dicom-sbox-34ad/locations/us/datasets/mib-air-dicom-dataset/dicomStores/mib-air-dicom-data-store/dicomWeb',
        qidoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-dicom-sbox-34ad/locations/us/datasets/mib-air-dicom-dataset/dicomStores/mib-air-dicom-data-store/dicomWeb',
        wadoRoot:
          'https://healthcare.googleapis.com/v1/projects/nih-nci-ccr-dicom-sbox-34ad/locations/us/datasets/mib-air-dicom-dataset/dicomStores/mib-air-dicom-data-store/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
  // This is an array, but we'll only use the first entry for now
  studyListFunctionsEnabled: true,
};
