/* filters displayed DICOM instances by their SignalPET study ID */
const instanceFilter = (query, instance) => {
  // 31C51020 is a private SiganlPET tag that stores the StudyID
  const instanceStudyId = instance['31C51020']?.Value?.[0];
  const queryStudyId = parseInt(query.get('SignalPETStudyID'));

  if (isNaN(queryStudyId)) {
    return true;
  }

  return instanceStudyId == queryStudyId;
};

/** @type {AppTypes.Config} */
window.config = {
  name: 'config/default.js',
  // whiteLabeling: {},
  extensions: [],
  modes: [],
  customizationService: [
    {
      'viewportOverlay.topLeft': {
        $set: [
          {
            id: 'patientIdOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Patient ID: ',
            color: 'rgba(255, 255, 255, 0.5)',
            title: 'Patient ID: ',
            condition: ({ instance }) => instance && instance.PatientID,
            attribute: 'PatientID',
          },
          {
            id: 'patientNameOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Patient Name: ',
            attribute: 'PatientName',
            title: 'Patient Name',
            color: 'rgba(255, 255, 255, 0.5)',
            condition: ({ instance }) =>
              instance && instance.PatientName && instance.PatientName.Alphabetic,
            contentF: ({ instance, formatters: { formatPN } }) =>
              formatPN(instance.PatientName.Alphabetic),
          },
          {
            id: 'studyDateOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Study Date: ',
            attribute: 'StudyDate',
            title: 'Study Date',
            color: 'rgba(255, 255, 255, 0.5)',
            condition: ({ instance }) => instance && instance.StudyDate,
            contentF: ({ instance, formatters: { formatDate } }) => formatDate(instance.StudyDate),
          },
          {
            id: 'studyTimeOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Study Time: ',
            attribute: 'StudyTime',
            title: 'Study Time',
            color: 'rgba(255, 255, 255, 0.5)',
            condition: ({ instance }) => instance && instance.StudyTime,
            contentF: ({ instance, formatters: { formatTime } }) => formatTime(instance.StudyTime),
          },
          {
            id: 'speciesOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Species: ',
            attribute: 'PatientSpeciesDescription',
            title: 'Species',
            color: 'rgba(255, 255, 255, 0.5)',
            condition: ({ instance }) => instance && instance.PatientSpeciesDescription,
            contentF: ({ instance }) => instance.PatientSpeciesDescription,
          },
          {
            id: 'patientSexOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Patient Sex: ',
            attribute: 'PatientSex',
            title: 'Patient Sex',
            color: 'rgba(255, 255, 255, 0.5)',
            condition: ({ instance }) => instance && instance.PatientSex,
            contentF: ({ instance }) => instance.PatientSex,
          },
          {
            id: 'patientBreedOverlay',
            inheritsFrom: 'ohif.overlayItem',
            label: 'Patient Breed: ',
            attribute: 'PatientBreed',
            title: 'Patient Breed',
            color: 'rgba(255, 255, 255, 0.5)',
            condition: ({ instance }) => instance && instance.PatientBreed,
            contentF: ({ instance }) => instance.PatientBreed,
          },
        ],
      },
      //  The "Demo Study" label is rendered whenever the demoStudy is set in the URL
      'viewportOverlay.topRight': {
        $set: [
          {
            id: 'demoStudyLabel',
            inheritsFrom: 'ohif.overlayItem',
            title: 'DEMO STUDY',
            condition: ({ isDemoStudy }) =>
              new URLSearchParams(window.location.search).get('demoStudy') === 'true',
            contentF: () => 'DEMO STUDY',
            color: 'yellow',
          },
        ],
      },
      'studyBrowser.thumbnailClickCallback': {
        callbacks: [
          ({ activeViewportId, servicesManager, commandsManager, isHangingProtocolLayout }) =>
            async displaySetInstanceUID => {
              const { hangingProtocolService, uiNotificationService } = servicesManager.services;
              let updatedViewports = [];
              const viewportId = activeViewportId;
              try {
                updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
                  viewportId,
                  displaySetInstanceUID,
                  isHangingProtocolLayout
                );
              } catch (error) {
                console.warn(error);
                uiNotificationService.show({
                  title: 'Thumbnail Click',
                  message: 'The selected display sets could not be added to the viewport.',
                  type: 'error',
                  duration: 3000,
                });
              }
              commandsManager.run('setDisplaySetsForViewports', {
                viewportsToUpdate: updatedViewports,
              });
            },
        ],
      },
      'studyBrowser.thumbnailDoubleClickCallback': {},
      'ohif.aboutModal': {
        hidden: true,
      },
      'ui.studyBrowserHeader': () => null,
      'panel.left.initialWidth': 89,
      'studyBrowser.thumbnailMenuItems': [
        {
          id: 'tagBrowser',
          label: 'Tag Browser',
          iconName: 'DicomTagBrowser',
          onClick: ({ commandsManager, displaySetInstanceUID }) => {
            commandsManager.runCommand('openDICOMTagViewer', {
              displaySetInstanceUID,
            });
          },
        },
      ],
    },
  ],
  showStudyList: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  investigationalUseDialog: { option: 'never' },
  showPatientInfo: 'disabled',
  strictZSpacingForVolumeViewport: true,
  measurementTrackingMode: 'none',
  groupEnabledModesFirst: true,
  enableStudyLazyLoad: true,
  allowMultiSelectExport: false,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    // Prefetch number is dependent on the http protocol. For http 2 or
    // above, the number of requests can be go a lot higher.
    prefetch: 25,
  },
  // Defines multi-monitor layouts
  multimonitor: [
    {
      id: 'split',
      test: ({ multimonitor }) => multimonitor === 'split',
      screens: [
        {
          id: 'ohif0',
          screen: null,
          location: {
            screen: 0,
            width: 0.5,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'ohif1',
          screen: null,
          location: {
            width: 0.5,
            height: 1,
            left: 0.5,
            top: 0,
          },
          options: 'location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },

    {
      id: '2',
      test: ({ multimonitor }) => multimonitor === '2',
      screens: [
        {
          id: 'ohif0',
          screen: 0,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
        {
          id: 'ohif1',
          screen: 1,
          location: {
            width: 1,
            height: 1,
            left: 0,
            top: 0,
          },
          options: 'fullscreen=yes,location=no,menubar=no,scrollbars=no,status=no,titlebar=no',
        },
      ],
    },
  ],
  defaultDataSourceName: 'signalpet',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'signalpet',
      configuration: {
        friendlyName: 'SignalPET PACS',
        name: 'signalpet',
        wadoUriRoot: 'http://localhost:32080/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'http://localhost:32080/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'http://localhost:32080/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: false,
        omitQuotationForMultipartRequest: true,
        enableStudyLazyLoad: true,
        instanceFilter,
      },
    },
  ],
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);

    // Could use services manager here to bring up a dialog/modal if needed.
    console.warn('test, navigate to https://ohif.org/');
  },
  // whiteLabeling: {
  //   createLogoComponentFn: function (React) {
  //     return React.createElement(
  //       'a',
  //       {
  //         target: '_self',
  //         rel: 'noopener noreferrer',
  //         className: 'text-purple-600 line-through',
  //         href: '_X___IDC__LOGO__LINK___Y_',
  //       },
  //       React.createElement('img', {
  //         src: './Logo.svg',
  //         className: 'w-14 h-14',
  //       })
  //     );
  //   },
  // },
};
