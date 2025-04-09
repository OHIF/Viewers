// Define module references for panels
const ohif = {
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  segmentation: '@ohif/extension-cornerstone.panelModule.panelSegmentation',
};

const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
};

// Define common toolbar buttons for each step
const defaultButtons = [
  {
    buttonSection: 'primary',
    buttons: [
      'MeasurementTools',
      'Zoom',
      'Pan',
      'WindowLevel',
      'Capture',
      'Layout',
      'Crosshairs',
      'MoreTools',
    ],
  },
  {
    buttonSection: 'measurementSection',
    buttons: [
      'Length',
      'Bidirectional',
      'ArrowAnnotate',
      'EllipticalROI',
      'RectangleROI',
      'CircleROI',
    ],
  },
];

// Define a second set of toolbar buttons with additional tools
const advancedButtons = [
  ...defaultButtons,
  {
    buttonSection: 'moreToolsSection',
    buttons: [
      'Reset',
      'rotate-right',
      'flipHorizontal',
      'ImageSliceSync',
      'ReferenceLines',
      'StackScroll',
      'Probe',
      'Angle',
    ],
  },
];

// Define the workflow steps
function getWorkflowSettings() {
  return {
    steps: [
      {
        id: 'seriesBrowser',
        name: 'Series Browser',
        layout: {
          panels: {
            left: [tracked.thumbnailList],
            right: [],
          },
          options: {
            leftPanelClosed: false,
            rightPanelClosed: true,
          },
        },
        toolbarButtons: defaultButtons,
        info: 'Browse through the available series in the study. The left panel shows the series list.',
      },
      {
        id: 'measurements',
        name: 'Measurements',
        layout: {
          panels: {
            left: [tracked.thumbnailList],
            right: [cornerstone.segmentation, tracked.measurements],
          },
          options: {
            leftPanelClosed: false,
            rightPanelClosed: false,
          },
        },
        toolbarButtons: advancedButtons,
        info: 'Create and manage measurements. The right panel shows measurement tools and segmentation options.',
      },
    ],
  };
}

export default getWorkflowSettings;
