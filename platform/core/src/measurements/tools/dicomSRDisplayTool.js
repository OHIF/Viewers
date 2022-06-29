export const dicomSRDisplayTool = {
  id: 'DICOMSRDisplayTool',
  name: 'DICOMSRDisplayTool',
  toolGroup: 'allTools',
  cornerstoneToolType: 'DICOMSRDisplayTool',
  options: {
    measurementTable: {
      displayFunction: data => {
        return `(SR) ${data.TrackingIdentifier ||
          data.lesionNamingNumber ||
          data.measurementNumber ||
          data.text ||
          ''}`;
      },
    },
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};

export default dicomSRDisplayTool;
