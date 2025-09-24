import React from 'react';
import Image from '@theme/IdealImage';

import measurementLabelsImage from '../../../assets/img/measurement-labels-auto.png';
import seriesSortImage from '../../../assets/img/seriesSort.png';
import windowLevelPresetsImage from '../../../assets/img/windowLevelPresets.png';
import colorbarImage from '../../../assets/img/colorbarImage.png';
import segmentationTableModeImage from '../../../assets/img/segmentationTableModeImage.png';
import segmentationTableModeImage2 from '../../../assets/img/segmentationTableModeImage2.png';
import segmentationShowAddSegmentImage from '../../../assets/img/segmentationShowAddSegmentImage.png';
import layoutSelectorCommonPresetsImage from '../../../assets/img/layoutSelectorCommonPresetsImage.png';
import layoutSelectorAdvancedPresetGeneratorImage from '../../../assets/img/layoutSelectorAdvancedPresetGeneratorImage.png';
import labellingFLow from '../../../assets/img/labelling-flow.png';
import progressLoading from '../../../assets/img/Loading-Indicator.png';
import loadingIndicatorProgress from '../../../assets/img/loading-indicator-icon.png';
import loadingIndicatorPercent from '../../../assets/img/loading-indicator-percent.png';
import viewportActionCorners from '../../../assets/img/viewport-action-corners.png';
import contextMenu from '../../../assets/img/context-menu.jpg';
import viewportDownloadWarning from '../../../assets/img/viewport-download-warning.png';
import segmentationOverlay from '../../../assets/img/segmentation-overlay.png';

import segDisplayEditingTrue from '../../../assets/img/segDisplayEditingTrue.png';
import segDisplayEditingFalse from '../../../assets/img/segDisplayEditingFalse.png';
import thumbnailMenuItemsImage from '../../../assets/img/thumbnailMenuItemsImage.png';
import studyMenuItemsImage from '../../../assets/img/studyMenuItemsImage.png';
import viewPortNotificationImage from '../../../assets/img/viewport-notification.png';
import captureViewportModal from '../../../assets/img/captureViewportModal.png';
import aboutModal from '../../../assets/img/aboutModal.png';
import promptBeginTrackingContent from '../../../assets/img/promptBeginTrackingContent.png';
import promptAddSeriesContent from '../../../assets/img/promptAddSeriesContent.png';
import promptSRTrackingContent from '../../../assets/img/promptSRTrackingContent.png';
import promptsegmentationContent from '../../../assets/img/promptsegmentationContent.png';
import promptRtstructContent from '../../../assets/img/promptRtstructContent.png';
import promptDiscardStudyContent from '../../../assets/img/promptDiscardStudyContent.png';
import promptDiscardSeriesContent from '../../../assets/img/promptDiscardSeriesContent.png';
import promptDiscardDirtyContent from '../../../assets/img/promptDiscardDirtyContent.png';
import promptTrackStudyContent from '../../../assets/img/promptTrackStudyContent.png';

export const viewportOverlayCustomizations = [
  {
    id: 'viewportOverlay.topRight',
    description: 'Defines the items displayed in the top-right overlay of the viewport.',
    default: [],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportOverlay.topRight': {
        $set: [
          // Add your overlay items here, e.g.:
          // { id: 'CustomOverlay', inheritsFrom: 'ohif.overlayItem.custom' },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'viewportOverlay.topLeft',
    description: 'Defines the items displayed in the top-left overlay of the viewport.',
    default: [
      {
        id: 'StudyDate',
        inheritsFrom: 'ohif.overlayItem',
        label: '',
        title: 'Study date',
        condition: ({ referenceInstance }) => referenceInstance?.StudyDate,
        contentF: ({ referenceInstance, formatters: { formatDate } }) =>
          formatDate(referenceInstance.StudyDate),
      },
      {
        id: 'SeriesDescription',
        inheritsFrom: 'ohif.overlayItem',
        label: '',
        title: 'Series description',
        condition: ({ referenceInstance }) =>
          referenceInstance && referenceInstance.SeriesDescription,
        contentF: ({ referenceInstance }) => referenceInstance.SeriesDescription,
      },
    ],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportOverlay.topLeft': {
        $splice: [
          [0, 1], // Remove 1 item starting at index 0 (removes StudyDate)
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'viewportOverlay.bottomLeft',
    description: 'Defines the items displayed in the bottom-left overlay of the viewport.',
    default: [
      {
        id: 'WindowLevel',
        inheritsFrom: 'ohif.overlayItem.windowLevel',
      },
      {
        id: 'ZoomLevel',
        inheritsFrom: 'ohif.overlayItem.zoomLevel',
        condition: props => {
          const activeToolName = props.toolGroupService.getActiveToolForViewport(props.viewportId);
          return activeToolName === 'Zoom';
        },
      },
    ],
    configuration: `

    // the following will push a yellow PatientNameOverlay to the bottomLeft overlay
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportOverlay.bottomLeft': {
        $push: [
           {
            id: 'PatientNameOverlay',
            inheritsFrom: 'ohif.overlayItem',
            attribute: 'PatientName',
            label: 'PN:',
            title: 'Patient Name',
            color: 'yellow',
            condition: ({ instance }) =>
              instance &&
              instance.PatientName &&
              instance.PatientName.Alphabetic,
            contentF: ({ instance, formatters: { formatPN } }) =>
              formatPN(instance.PatientName.Alphabetic) +
              ' ' +
              (instance.PatientSex ? '(' + instance.PatientSex + ')' : ''),
          },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'viewportOverlay.bottomRight',
    description: 'Defines the items displayed in the bottom-right overlay of the viewport.',
    default: [
      {
        id: 'InstanceNumber',
        inheritsFrom: 'ohif.overlayItem.instanceNumber',
      },
    ],
    configuration: `
      // same as above
  `,
  },
];

export const customizations = [
  {
    id: 'ohif.hotkeyBindings',
    description: 'Defines the hotkeys for the application.',
    default: 'look at hotkeyBindingsCustomization.ts file',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      // this will override the default hotkeys and only have one hotkey
      'ohif.hotkeyBindings': {
        $set: [
          {
            commandName: 'scaleDownViewport',
            label: 'Zoom Out',
            keys: ['-'],
            isEditable: true,
          },
        ],
      },
    },
  ],

  // or lets say you want to change one key of the default hotkeys to default
  // something else
  customizationService: [
    {
      // this will override the default hotkeys and only have one hotkey
      'ohif.hotkeyBindings': {
        $filter: {
          match: { commandName: 'scaleDownViewport' },
          $set: {
            keys: ['ctrl+shift+-'],
          },
        },
      },
    },
  ],
    `,
  },
  {
    id: 'measurementLabels',
    description: 'Labels for measurement tools in the viewer that are automatically asked for.',
    image: measurementLabelsImage,
    default: [],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      measurementLabels: {
        $set: {
          labelOnMeasure: true,
          exclusive: true,
          items: [
            { value: 'Head', label: 'Head' },
            { value: 'Shoulder', label: 'Shoulder' },
            { value: 'Knee', label: 'Knee' },
            { value: 'Toe', label: 'Toe' },
          ],
        },
      },
    },
  ],
};
    `,
  },

  {
    id: 'cornerstoneViewportClickCommands',
    description: 'Defines the viewport event handlers such as button1, button2, doubleClick, etc.',
    default: {
      doubleClick: {
        commandName: 'toggleOneUp',
        commandOptions: {},
      },
      button1: {
        commands: [
          {
            commandName: 'closeContextMenu',
          },
        ],
      },
      button3: {
        commands: [
          {
            commandName: 'showCornerstoneContextMenu',
            commandOptions: {
              requireNearbyToolData: true,
              menuId: 'measurementsContextMenu',
            },
          },
        ],
      },
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      cornerstoneViewportClickCommands: {
        doubleClick: {
          $push: [
            () => {
              console.debug('double click');
            },
          ],
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'cinePlayer',
    description: 'Customizes the cine player component.',
    default: 'The CinePlayer component in the UI',
    configuration: null,
  },
  {
    id: 'cornerstone.windowLevelPresets',
    description: 'Window level presets for the cornerstone viewport.',
    image: windowLevelPresetsImage,
    default: {
      CT: [
        { description: 'Soft tissue', window: '400', level: '40' },
        { description: 'Lung', window: '1500', level: '-600' },
        { description: 'Liver', window: '150', level: '90' },
        { description: 'Bone', window: '2500', level: '480' },
        { description: 'Brain', window: '80', level: '40' },
      ],

      PT: [
        { description: 'Default', window: '5', level: '2.5' },
        { description: 'SUV', window: '0', level: '3' },
        { description: 'SUV', window: '0', level: '5' },
        { description: 'SUV', window: '0', level: '7' },
        { description: 'SUV', window: '0', level: '8' },
        { description: 'SUV', window: '0', level: '10' },
        { description: 'SUV', window: '0', level: '15' },
      ],
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'cornerstone.windowLevelPresets': {
        $filter: {
          match: { id: 'ct-soft-tissue' },
          $merge: {
            window: '500',
            level: '50',
          },
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'cornerstone.colorbar',
    description: 'Customizes the appearance and behavior of the cornerstone colorbar.',
    image: colorbarImage,
    default: `
     {
      width: '16px',
      colorbarTickPosition: 'left',
      colormaps,
      colorbarContainerPosition: 'right',
      colorbarInitialColormap: DefaultColormap,
    }
    `,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'cornerstone.colorbar': {
        $merge: {
          width: '20px',
          colorbarContainerPosition: 'left',
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'cornerstone.3dVolumeRendering',
    description:
      'Customizes the settings for 3D volume rendering in the cornerstone viewport, including presets and rendering quality range.',
    default: `{
      volumeRenderingPresets: VIEWPORT_PRESETS,
      volumeRenderingQualityRange: {
        min: 1,
        max: 4,
        step: 1,
      },
    }`,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'cornerstone.3dVolumeRendering': {
        $merge: {
          volumeRenderingQualityRange: {
            min: 2,
            max: 6,
            step: 0.5,
          },
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'autoCineModalities',
    description: 'Specifies the modalities for which the cine player automatically starts.',
    default: ['OT', 'US'],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'autoCineModalities': {
        $set: ['OT', 'US', 'MR'], // Adds 'MR' as an additional modality for auto cine playback
      },
    },
  ],
};
  `,
  },
  {
    id: 'cornerstone.overlayViewportTools',
    description: 'Configures the tools available in the cornerstone SEG and RT tool groups.',
    default: `{
      active: [
        {
          toolName: toolNames.WindowLevel,
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        },
        {
          toolName: toolNames.Pan,
          bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
        },
        {
          toolName: toolNames.Zoom,
          bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
        },
        {
          toolName: toolNames.StackScroll,
          bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
        },
      ],
      enabled: [
        {
          toolName: toolNames.PlanarFreehandContourSegmentation,
          configuration: {
            displayOnePointAsCrosshairs: true,
          },
        },
      ],
    }`,
    configuration: `
  `,
  },
  {
    id: 'layoutSelector.commonPresets',
    description: 'Defines the default layout presets available in the application.',
    image: layoutSelectorCommonPresetsImage,
    default: [
      {
        icon: 'layout-common-1x1',
        commandOptions: {
          numRows: 1,
          numCols: 1,
        },
      },
      {
        icon: 'layout-common-1x2',
        commandOptions: {
          numRows: 1,
          numCols: 2,
        },
      },
      {
        icon: 'layout-common-2x2',
        commandOptions: {
          numRows: 2,
          numCols: 2,
        },
      },
      {
        icon: 'layout-common-2x3',
        commandOptions: {
          numRows: 2,
          numCols: 3,
        },
      },
    ],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'layoutSelector.commonPresets': {
        $set: [
          {
            icon: 'layout-common-1x1',
            commandOptions: {
              numRows: 1,
              numCols: 1,
            },
          },
          {
            icon: 'layout-common-1x2',
            commandOptions: {
              numRows: 1,
              numCols: 2,
            },
          },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'layoutSelector.advancedPresetGenerator',
    description: 'Generates advanced layout presets based on hanging protocols.',
    image: layoutSelectorAdvancedPresetGeneratorImage,
    default: `({ servicesManager }) => {
      // by default any hanging protocol that has isPreset set to true will be included

      // a function that returns an array of presets
      // of form {
      //   icon: 'layout-common-1x1',
      //   title: 'Custom Protocol',
      //   commandOptions: {
      //     protocolId: 'customProtocolId',
      //   },
      //   disabled: false,
      // }
    }`,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'layoutSelector.advancedPresetGenerator': {
        $apply: (defaultGenerator) => {
          return ({ servicesManager }) => {
            const presets = defaultGenerator({ servicesManager });

            // Add a custom preset for a specific hanging protocol
            presets.push({
              icon: 'custom-icon',
              title: 'Custom Protocol',
              commandOptions: {
                protocolId: 'customProtocolId',
              },
              disabled: false,
            });

            return presets;
          };
        },
      },
    },
  ],
};
  `,
  },
  {
    id: 'dicomUploadComponent',
    description: 'Customizes the appearance and behavior of the dicom upload component.',
    default: 'The DicomUpload component in the UI',
    configuration: null,
  },
  {
    id: 'onBeforeSRAddMeasurement',
    description: 'Customizes the behavior of the SR measurement before it is added to the viewer.',
    default: ({ measurement, StudyInstanceUID, SeriesInstanceUID }) => {
      return measurement;
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      onBeforeSRAddMeasurement: {
        $set: ({ measurement, StudyInstanceUID, SeriesInstanceUID }) => {
          // Note: it should return measurement
          console.debug('onBeforeSRAddMeasurement');
          return measurement;
        },
      },
    },
  ],
};
    `,
  },
  {
    id: 'onBeforeDicomStore',
    description:
      'A hook that modifies the DICOM dictionary before it is stored. The customization should return the modified DICOM dictionary.',
    default: ({ dicomDict, measurementData, naturalizedReport }) => {
      // Default implementation returns the DICOM dictionary as is
      return dicomDict;
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'onBeforeDicomStore': {
        $set: ({ dicomDict, measurementData, naturalizedReport }) => {
          // Example customization: Add a custom tag to the DICOM dictionary
          dicomDict['0010,0010'] = 'CustomizedPatientName'; // Patient's Name (example)
          dicomDict['0008,103E'] = 'CustomStudyDescription'; // Study Description (example)

          // Return the modified DICOM dictionary
          return dicomDict;
        },
      },
    },
  ],
};
  `,
  },
  {
    id: 'sortingCriteria',
    description:
      'Defines the series sorting criteria for hanging protocols. Note that this does not affect the order in which series are displayed in the study browser.',
    default: `function seriesInfoSortingCriteria(firstSeries, secondSeries) {
      const aLowPriority = isLowPriorityModality(firstSeries.Modality ?? firstSeries.modality);
      const bLowPriority = isLowPriorityModality(secondSeries.Modality ?? secondSeries.modality);

      if (aLowPriority) {
        // Use the reverse sort order for low priority modalities so that the
        // most recent one comes up first as usually that is the one of interest.
        return bLowPriority ? defaultSeriesSort(secondSeries, firstSeries) : 1;
      } else if (bLowPriority) {
        return -1;
      }

      return defaultSeriesSort(firstSeries, secondSeries);
    }`,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'sortingCriteria': {
        $set: function customSortingCriteria(firstSeries, secondSeries) {

          return someSort(firstSeries, secondSeries);
        },
      },
    },
  ],
};
  `,
  },
  {
    id: 'customOnDropHandler ',
    description:
      'CustomOnDropHandler in the viewport grid enables users to handle additional functionalities during the onDrop event in the viewport.',
    default: props => {
      return Promise.resolve({ handled: false });
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      customOnDropHandler: {
        $set: customOnDropHandler
      },
    },
  ],
};
  `,
  },
  {
    id: 'ui.notificationComponent',
    description: 'Define the component which is used to render viewport notifications',
    default: 'Default Notification component in viewport',
    image: [viewPortNotificationImage],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'ui.notificationComponent': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'ui.loadingIndicatorTotalPercent',
    description: 'Customizes the LoadingIndicatorTotalPercent component.',
    image: loadingIndicatorPercent,
    default: null, //use platform/ui component as default
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'ui.loadingIndicatorTotalPercent': {
                $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ui.loadingIndicatorProgress',
    description: 'Customizes the LoadingIndicatorProgress component.',
    image: loadingIndicatorProgress,
    default: null, //use platform/ui component as default
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'ui.loadingIndicatorProgress': {
                $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ui.progressLoadingBar',
    description: 'Customizes the ProgressLoadingBar component.',
    image: progressLoading,
    default: null, //use platform/ui component as default
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'ui.progressLoadingBar': {
                $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ui.viewportActionCorner',
    description: 'Customizes the viewportActionCorner component.',
    iamge: viewportActionCorners,
    default: null, //use platform/ui component as default
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'ui.viewportActionCorner': {
                $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ui.contextMenu',
    description: 'Customizes the Context menu component.',
    image: contextMenu,
    default: null, //use platform/ui component as default
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'ui.contextMenu': {
                $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ui.labellingComponent',
    description: 'Customizes the labelling flow component.',
    image: labellingFLow,
    default: null, //use platform/ui component as default
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'ui.labellingComponent': {
                $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'viewportDownload.warningMessage',
    description: 'Customizes the warning message for the viewport download form.',
    image: viewportDownloadWarning,
    default: {
      enabled: true,
      value: 'Not For Diagnostic Use',
    },
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'viewportDownload.warningMessage': {
              $set: {
                enabled: true,
                value: 'Careful! This is not for diagnostic use.',
              },
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ohif.captureViewportModal',
    description: 'The modal for capturing the viewport image.',
    image: captureViewportModal,
    default: 'Our own default component',
    configuration: `
      window.config = {
        // rest of window config

        // You can use the component from ImageModal and FooterAction
        // to build your own custom component
        customizationService: [
          {
            'ohif.captureViewportModal': {
              $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ohif.aboutModal',
    description: 'The About modal',
    image: aboutModal,
    default: 'Our own default component',
    configuration: `
      window.config = {
        // rest of window config

        // You can use the component from AboutModal
        // to build your own custom component
        customizationService: [
          {
            'ohif.aboutModal': {
              $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'viewportDownload.warningMessage',
    description: 'Customizes the warning message for the viewport download form.',
    image: viewportDownloadWarning,
    default: {
      enabled: true,
      value: 'Not For Diagnostic Use',
    },
    configuration: `
      window.config = {
        // rest of window config
        customizationService: [
          {
            'viewportDownload.warningMessage': {
              $set: {
                enabled: true,
                value: 'Careful! This is not for diagnostic use.',
              },
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ohif.captureViewportModal',
    description: 'The modal for capturing the viewport image.',
    image: captureViewportModal,
    default: 'Our own default component',
    configuration: `
      window.config = {
        // rest of window config

        // You can use the component from ImageModal and FooterAction
        // to build your own custom component
        customizationService: [
          {
            'ohif.captureViewportModal': {
              $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'ohif.aboutModal',
    description: 'The About modal',
    image: aboutModal,
    default: 'Our own default component',
    configuration: `
      window.config = {
        // rest of window config

        // You can use the component from AboutModal
        // to build your own custom component
        customizationService: [
          {
            'ohif.aboutModal': {
              $set: CustomizedComponent,
            },
          },
        ],
      };
        `,
  },
  {
    id: 'viewportNotification.beginTrackingMessage',
    description: 'Define the content to be displayed in begin tracking prompt',
    default: 'Track measurements for this series?',
    image: [promptBeginTrackingContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.beginTrackingMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.trackNewSeriesMessage',
    description: 'Define the content to be displayed in track new series prompt',
    default: 'Do you want to add this measurement to the existing report?',
    image: [promptAddSeriesContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.trackNewSeriesMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.discardSeriesMessage',
    description: 'Define the content to be displayed in discard series prompt',
    default:
      'You have existing tracked measurements. What would you like to do with your existing tracked measurements?',
    image: [promptDiscardSeriesContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.discardSeriesMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.trackNewStudyMessage',
    description: 'Define the content to be displayed in track new study prompt',
    default: 'Track measurements for this series?',
    image: [promptTrackStudyContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.trackNewStudyMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.discardStudyMessage',
    description: 'Define the content to be displayed in discard study prompt',
    default:
      'Measurements cannot span across multiple studies. Do you want to save your tracked measurements?',
    image: [promptDiscardStudyContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.discardStudyMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.hydrateSRMessage',
    description: 'Define the content to be displayed in hydrate SR prompt',
    default: 'Do you want to continue tracking measurements for this study?',
    image: [promptSRTrackingContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.hydrateSRMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.hydrateRTMessage',
    description: 'Define the content to be displayed in hydrate RT prompt',
    default: 'Do you want to open this Segmentation?',
    image: [promptRtstructContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.hydrateRTMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.hydrateSEGMessage',
    description: 'Define the content to be displayed in hydrate SEG prompt',
    default: 'Do you want to open this Segmentation?',
    image: [promptsegmentationContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.hydrateSEGMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'viewportNotification.discardDirtyMessage',
    description: 'Define the content to be displayed in hydrate SR prompt',
    default: 'There are unsaved measurements. Do you want to save it?',
    image: [promptDiscardDirtyContent],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'viewportNotification.discardDirtyMessage': {
          $set: CustomizedComponent,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptBeginTracking',
    description:
      'Define the functionality to connect with the measurement tracking machine on begin measurement tracking',
    default: 'promptBeginTracking',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptBeginTracking': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptHydrateStructuredReport',
    description:
      'Define the functionality to connect with the measurement tracking machine on hydrate SR',
    default: 'promptHydrateStructuredReport',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptHydrateStructuredReport': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptTrackNewSeries',
    description:
      'Define the functionality to connect with the measurement tracking machine on tracking new series',
    default: 'promptTrackNewSeries',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptTrackNewSeries': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptTrackNewStudy',
    description:
      'Define the functionality to connect with the measurement tracking machine on tracking new study',
    default: 'promptTrackNewStudy',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptTrackNewStudy': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptLabelAnnotation',
    description:
      'Define the functionality to connect with the measurement tracking machine on begin measurement tracking',
    default: 'promptLabelAnnotation',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptLabelAnnotation': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptSaveReport',
    description:
      'Define the functionality to connect with the measurement tracking machine on save SR report',
    default: 'promptSaveReport',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptSaveReport': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
  {
    id: 'measurement.promptHasDirtyAnnotations',
    description:
      'Define the functionality to connect with the measurement tracking machine on there are dirty annotations',
    default: 'promptHasDirtyAnnotations',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'measurement.promptHasDirtyAnnotations': {
          $set: customFunction,
      },
    },
  ],
};
    `,
  },
];

export const segmentationCustomizations = [
  {
    id: 'panelSegmentation.tableMode',
    description: 'Defines the mode of the segmentation table.',
    image: [segmentationTableModeImage, segmentationTableModeImage2],
    default: 'collapsed',
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'panelSegmentation.tableMode': {
        $set: 'expanded',
      },
    },
  ],
};
    `,
  },
  {
    id: 'panelSegmentation.showAddSegment',
    description:
      'Controls whether the "Add Segment" button is displayed in the segmentation panel.',
    default: true,
    image: segmentationShowAddSegmentImage,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'panelSegmentation.showAddSegment': {
        $set: false, // Set to false to hide the "Add Segment" button
      },
    },
  ],
};
    `,
  },
  {
    id: 'panelSegmentation.readableText',
    description: 'Defines the readable text labels for segmentation panel statistics and metrics.',
    default: {
      lesionStats: 'Lesion Statistics',
      minValue: 'Minimum Value',
      maxValue: 'Maximum Value',
      meanValue: 'Mean Value',
      volume: 'Volume (ml)',
      suvPeak: 'SUV Peak',
      suvMax: 'Maximum SUV',
      suvMaxIJK: 'SUV Max IJK',
      lesionGlyoclysisStats: 'Lesion Glycolysis',
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'panelSegmentation.readableText': {
        $merge: {
          lesionStats: 'Lesion Stats',
        },
      },
    },
  ],
};
  `,
  },
  {
    id: 'panelSegmentation.onSegmentationAdd',
    description: 'Defines the behavior when a new segmentation is added to the segmentation panel.',
    default: `() => {
      // default is to create a labelmap for the active viewport
      const { viewportGridService } = servicesManager.services;
      const viewportId = viewportGridService.getState().activeViewportId;
      commandsManager.run('createLabelmapForViewport', { viewportId });
    }`,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'panelSegmentation.onSegmentationAdd': {
        $set: () => {
          const { viewportGridService } = servicesManager.services;
          const viewportId = viewportGridService.getState().activeViewportId;
          commandsManager.run('createNewLabelmapFromPT');
        },
      },
    },
  ],
};
  `,
  },
  {
    id: 'panelSegmentation.disableEditing',
    description: 'Determines whether editing of segmentations in the panel is disabled.',
    default: false,
    image: [segDisplayEditingTrue, segDisplayEditingFalse],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'panelSegmentation.disableEditing': {
        $set: true, // Disables editing of segmentations in the panel
      },
    },
  ],
};
  `,
  },
];

export const measurementsCustomizations = [
  {
    id: 'panelMeasurement.disableEditing',
    description:
      'Determines whether editing measurements in the viewport is disabled after SR hydration',
    default: false,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'panelMeasurement.disableEditing': {
        $set: true, // Disables editing measurements in the panel
      },
    },
  ],
};
  `,
  },
  {
    id: 'cornerstone.measurements',
    description:
      'Defines configuration for measurement tools, including display text and reporting options.',
    default: {
      Angle: {
        displayText: [],
        report: [],
      },
      CobbAngle: {
        displayText: [],
        report: [],
      },
      ArrowAnnotate: {
        displayText: [],
        report: [],
      },
      RectangleROi: {
        displayText: [],
        report: [],
      },
      CircleROI: {
        displayText: [],
        report: [],
      },
      EllipticalROI: {
        displayText: [],
        report: [],
      },
      Bidirectional: {
        displayText: [],
        report: [],
      },
      Length: {
        displayText: [],
        report: [],
      },
      LivewireContour: {
        displayText: [],
        report: [],
      },
      SplineROI: {
        displayText: [
          {
            displayName: 'Area',
            value: 'area',
            type: 'value',
          },
          {
            value: 'areaUnits',
            for: ['area'],
            type: 'unit',
          },
        ],
        report: [
          {
            displayName: 'Area',
            value: 'area',
            type: 'value',
          },
          {
            displayName: 'Unit',
            value: 'areaUnits',
            type: 'value',
          },
        ],
      },
      PlanarFreehandROI: {
        displayTextOpen: [
          {
            displayName: 'Length',
            value: 'length',
            type: 'value',
          },
        ],
        displayText: [
          {
            displayName: 'Mean',
            value: 'mean',
            type: 'value',
          },
          {
            displayName: 'Max',
            value: 'max',
            type: 'value',
          },
          {
            displayName: 'Area',
            value: 'area',
            type: 'value',
          },
          {
            value: 'pixelValueUnits',
            for: ['mean', 'max'],
            type: 'unit',
          },
          {
            value: 'areaUnits',
            for: ['area'],
            type: 'unit',
          },
        ],
        report: [
          {
            displayName: 'Mean',
            value: 'mean',
            type: 'value',
          },
          {
            displayName: 'Max',
            value: 'max',
            type: 'value',
          },
          {
            displayName: 'Area',
            value: 'area',
            type: 'value',
          },
          {
            displayName: 'Unit',
            value: 'unit',
            type: 'value',
          },
        ],
      },
    },
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'cornerstone.measurements': {
        $set: {
          SplineROI: {
            displayText: [
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                value: 'areaUnits',
                for: ['area'],
                type: 'unit',
              },
            ],
            report: [
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                displayName: 'Unit',
                value: 'areaUnits',
                type: 'value',
              },
            ],
          },
          PlanarFreehandROI: {
            displayTextOpen: [
              {
                displayName: 'Length',
                value: 'length',
                type: 'value',
              },
            ],
            displayText: [
              {
                displayName: 'Mean',
                value: 'mean',
                type: 'value',
              },
              {
                displayName: 'Max',
                value: 'max',
                type: 'value',
              },
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                value: 'pixelValueUnits',
                for: ['mean', 'max'],
                type: 'unit',
              },
              {
                value: 'areaUnits',
                for: ['area'],
                type: 'unit',
              },
            ],
            report: [
              {
                displayName: 'Mean',
                value: 'mean',
                type: 'value',
              },
              {
                displayName: 'Max',
                value: 'max',
                type: 'value',
              },
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                displayName: 'Unit',
                value: 'unit',
                type: 'value',
              },
            ],
          },
        },
      },
    },
  ],
};
  `,
  },
];

export const studyBrowserCustomizations = [
  {
    id: 'studyBrowser.studyMode',
    description:
      'Controls the study browser mode to determine whether to show all studies (including prior studies) or only the current study.',
    default: `'all'`,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'studyBrowser.studyMode': {
         $set: 'primary', // or recent
      },
    },
  ],
};
  `,
  },
  {
    id: 'studyBrowser.viewPresets',
    description: 'Defines the view presets for the study browser, such as list or thumbnail views.',
    default: [
      {
        id: 'list',
        iconName: 'ListView',
        selected: false,
      },
      {
        id: 'thumbnails',
        iconName: 'ThumbnailView',
        selected: true,
      },
    ],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'studyBrowser.viewPresets': {
        $set: [
          {
            id: 'list',
            iconName: 'ListView',
            selected: true, // Makes the list view the default selected option
          },
          {
            id: 'thumbnails',
            iconName: 'ThumbnailView',
            selected: false,
          },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'studyBrowser.sortFunctions',
    description: 'Sorting options for study browser items.',
    image: seriesSortImage,
    default: [
      {
        label: 'Series Number',
        sortFunction: (a, b) => {
          return a?.SeriesNumber - b?.SeriesNumber;
        },
      },
      {
        label: 'Series Date',
        sortFunction: (a, b) => {
          const dateA = new Date(formatDate(a?.SeriesDate));
          const dateB = new Date(formatDate(b?.SeriesDate));
          return dateB.getTime() - dateA.getTime();
        },
      },
    ],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'studyBrowser.sortFunctions': {
        $push: [
          {
            label: 'Series Stuff',
            sortFunction: (a, b) => Stuff,
          },
        ],
      },
    },
  ],
};
    `,
  },
  {
    id: 'studyBrowser.thumbnailMenuItems',
    description:
      'Defines the menu items available in the thumbnail menu items of the study browser.',
    image: thumbnailMenuItemsImage,
    default: [
      {
        id: 'tagBrowser',
        label: 'Tag Browser',
        iconName: 'DicomTagBrowser',
        commands: 'openDICOMTagViewer',
      },
    ],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'studyBrowser.thumbnailMenuItems': {
        $set: [
          {
            id: 'tagBrowser',
            label: 'Tag Browser',
            iconName: 'DicomTagBrowser',
            commands: 'openDICOMTagViewer',
          },
          {
            id: 'deleteThumbnail',
            label: 'Delete',
            iconName: 'Delete',
            commands: 'deleteThumbnail',
          },
          {
            id: 'markAsFavorite',
            label: 'Mark as Favorite',
            commands: 'markAsFavorite',
          },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'studyBrowser.studyMenuItems',
    description: 'Defines the menu items available in the study menu items of the study browser.',
    image: studyMenuItemsImage,
    default: [],
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
    {
      'studyBrowser.studyMenuItems': {
        $set: [
          {
            id: 'downloadStudy',
            label: 'Download Study',
            iconName: 'Download',
            commands: () => {
              console.debug('downloadStudy');
            },
          },
        ],
      },
    },
  ],
};
  `,
  },
  {
    id: 'studyBrowser.thumbnailDoubleClickCallback',
    description:
      'Defines the callback function for when the user double clicks a series on the study browser.',
    default: `{
    callback: ({
            activeViewportId,
            servicesManager,
            isHangingProtocolLayout
        }) =>
        async displaySetInstanceUID => {
            const {
                hangingProtocolService,
                viewportGridService,
                uiNotificationService
            } =
            servicesManager.services;
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
                    title: 'Thumbnail Double Click',
                    message: 'The selected display sets could not be added to the viewport.',
                    type: 'error',
                    duration: 3000,
                });
            }

            commandsManager.run({
              commandName: 'setDisplaySetsForViewports',
              commandOptions: { viewportsToUpdate: updatedViewports },
            });
        },
}`,
    configuration: `
window.config = {
    // rest of window config
    customizationService: [{
        'studyBrowser.thumbnailDoubleClickCallback': {
            callback: ({
                    activeViewportId,
                    commandsManager,
                    servicesManager,
                    isHangingProtocolLayout
                }) =>
                async displaySetInstanceUID => {
                    const {
                        hangingProtocolService,
                        viewportGridService,
                        uiNotificationService
                    } =
                    servicesManager.services;

                    let updatedViewports = [];
                    const viewportId = activeViewportId;

                    // Changing original function here:
                    if (isBlacklistedModality(displaySetInstanceUID)) {
                        return;
                    }

                    try {
                        updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
                            viewportId,
                            displaySetInstanceUID,
                            isHangingProtocolLayout
                        );
                    } catch (error) {
                        console.warn(error);
                        uiNotificationService.show({
                            title: 'Thumbnail Double Click',
                            message: 'The selected display sets could not be added to the viewport.',
                            type: 'error',
                            duration: 3000,
                        });
                    }
                  commandsManager.run({
                    commandName: 'setDisplaySetsForViewports',
                    commandOptions: { viewportsToUpdate: updatedViewports },
                  });
                };
        },
    }],
};
  `,
  },
  {
    id: 'instanceSortingCriteria',
    description: 'Defines the instance sorting criteria to sort the images',
    default: `{
    sortFunctions: {},
    defaultSortFunctionName: '',
  }`,
    configuration: `
window.config = {
  // rest of window config
  customizationService: [
   {
      'instanceSortingCriteria': {
        $set: {
          sortFunctions: {
            sort: (a, b) => {}
          },
          defaultSortFunctionName: 'sort',
        },
      },
    }
  ],
};
  `,
  },
];

export const TableGenerator = (customizations: any[]) => {
  return customizations.map(({ id, description, default: defaultValue, configuration, image }) => (
    <div
      key={id}
      style={{ marginBottom: '2rem', borderRadius: '8px', padding: '1rem' }}
    >
      <h3
        id={id.toLowerCase().replace(/\./g, '')}
        style={{ marginBottom: '1rem', fontSize: '1.5rem' }}
      >
        {id}
      </h3>
      <table style={{ width: '100%', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>ID</th>
            <td style={{ wordBreak: 'break-word' }}>
              <code>{id}</code>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>Description</th>
            <td>
              <div>{description}</div>
              {image && (
                <div>
                  {Array.isArray(image) ? (
                    image.map((img, index) => (
                      <Image
                        key={index}
                        img={img}
                        alt={`${id}-${index + 1}`}
                        style={{ width: '400px' }}
                      />
                    ))
                  ) : (
                    <Image
                      img={image}
                      alt={id}
                      style={{ width: '400px' }}
                    />
                  )}
                </div>
              )}
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>Default Value</th>
            <td style={{ wordBreak: 'break-word' }}>
              <pre>
                {typeof defaultValue === 'string'
                  ? defaultValue
                  : JSON.stringify(defaultValue, null, 2)}
              </pre>
            </td>
          </tr>
          <tr>
            <th style={{ textAlign: 'left', verticalAlign: 'top', width: '20%' }}>Example</th>
            <td style={{ wordBreak: 'break-word' }}>
              {configuration && (
                <div>
                  <pre>
                    <code>{configuration}</code>
                  </pre>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ));
};
