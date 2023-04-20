import DicomUpload from './components/DicomUpload/DicomUpload';

function getCustomizationModule() {
  return [
    {
      name: 'cornerstoneDicomUploadComponent',
      value: {
        id: 'dicomUploadComponent',
        component: DicomUpload,
      },
    },
  ];
}

export default getCustomizationModule;
