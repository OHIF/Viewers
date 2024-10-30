/** @type {AppTypes.Config} */

const availableMlModels = {
  'LQ Adapter': {
    displayName: 'LQ Adapter',
    type: 'Detection',
    annotationColor: 'rgb(255, 0, 0)',
    detectedObject: 'Gall Bladder',
  },
  focalnet: {
    displayName: 'FocalNet-DINO',
    type: 'Detection',
    annotationColor: 'rgb(0, 255, 0)',
    detectedObject: 'Breast Cancer',
  },
  multiview: {
    displayName: 'Multiview',
    type: 'Detection',
    annotationColor: 'rgb(255, 255, 255)',
    detectedObject: 'Breast Cancer',
  },
  densemass: {
    displayName: 'Densemass',
    type: 'Detection',
    annotationColor: 'rgb(255, 0, 0)',
    detectedObject: 'Breast Cancer',
  },
  smallmass: {
    displayName: 'Smallmass',
    type: 'Detection',
    annotationColor: 'rgb(255, 192, 203)',
    detectedObject: 'Breast Cancer',
  },
};
const availableMlModelsEnumsSet = new Set(Object.keys(availableMlModels));
const availableMlModelsDisplayNamesSet = new Set(
  Object.keys(availableMlModels).map(mlModelEnum => availableMlModels[mlModelEnum].displayName)
);
const mlModelDisplayNameToEnum = Object.keys(availableMlModels).reduce((acc, key) => {
  const displayName = availableMlModels[key].displayName;
  acc[displayName] = key;
  return acc;
}, {});

function processDicomSRAnnotation(annotation) {
  const annotationLabel = annotation.data.labels[0].label;
  let annotationColor = null;

  if (availableMlModelsEnumsSet.has(annotationLabel)) {
    const modelEnum = annotationLabel;

    annotation.data.labels[0].label = availableMlModels[modelEnum].displayName;
    annotation.data.labels[0].value = availableMlModels[modelEnum].detectedObject;
    annotationColor = availableMlModels[modelEnum].annotationColor;
  } else if (availableMlModelsDisplayNamesSet.has(annotationLabel)) {
    const modelEnum = mlModelDisplayNameToEnum[annotationLabel];
    annotationColor = availableMlModels[modelEnum].annotationColor;
  }

  return {
    updatedAnnotation: annotation,
    annotationColor: annotationColor,
  };
}

const customization = {
  processDicomSRAnnotation: processDicomSRAnnotation,
};

window.config = {
  customization: customization,

  routerBasename: '/',
  showStudyList: true,
  customizationService: {
    dicomUploadComponent:
      '@ohif/extension-cornerstone.customizationModule.cornerstoneDicomUploadComponent',
  },
  extensions: [],
  modes: [],
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  studyPrefetcher: {
    enabled: true,
    displaySetsCount: 2,
    maxNumPrefetchRequests: 10,
    order: 'closest',
  },
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Orthanc Server',
        name: 'Orthanc',
        wadoUriRoot: '/wado',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  },
};
