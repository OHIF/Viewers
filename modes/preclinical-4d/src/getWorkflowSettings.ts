const dynamicVolume = {
  sopClassHandler:
    '@ohif/extension-cornerstone-dynamic-volume.sopClassHandlerModule.dynamic-volume',
  leftPanel: '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
  segmentation: '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-segmentation',
};

const cornerstone = {
  segmentation: '@ohif/extension-cornerstone.panelModule.panelSegmentationNoHeader',
  activeViewportWindowLevel: '@ohif/extension-cornerstone.panelModule.activeViewportWindowLevel',
};

function getDefaultButtons({ toolbarService }) {
  return [
    {
      buttonSection: toolbarService.sections.primary,
      buttons: ['MeasurementTools', 'Zoom', 'WindowLevel', 'Crosshairs', 'Pan'],
    },
    {
      buttonSection: 'MeasurementTools',
      buttons: ['Length', 'Bidirectional', 'ArrowAnnotate', 'EllipticalROI'],
    },
  ];
}

function getROIThresholdToolbox({ toolbarService }) {
  return [
    {
      buttonSection: toolbarService.sections.dynamicToolbox,
      buttons: ['SegmentationTools'],
    },
    {
      buttonSection: 'SegmentationTools',
      buttons: ['BrushTools', 'RectangleROIStartEndThreshold'],
    },
    {
      buttonSection: 'BrushTools',
      buttons: ['Brush', 'Eraser', 'Threshold'],
    },
  ];
}

const defaultLeftPanel = [[dynamicVolume.leftPanel, cornerstone.activeViewportWindowLevel]];

const defaultLayout = {
  panels: {
    left: defaultLeftPanel,
    right: [],
  },
};

function getWorkflowSettings({ servicesManager }) {
  const { toolbarService } = servicesManager.services;
  const defaultButtons = getDefaultButtons({ toolbarService });
  const ROIThresholdToolbox = getROIThresholdToolbox({ toolbarService });

  return {
    steps: [
      {
        id: 'dataPreparation',
        name: 'Data Preparation',
        layout: {
          panels: {
            left: defaultLeftPanel,
          },
        },
        toolbarButtons: defaultButtons,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'dataPreparation',
        },
        info: 'In the Data Preparation step, you can visualize the dynamic PT volume data in three orthogonal views: axial, sagittal, and coronal. Use the left panel controls to adjust the visualization settings, such as playback speed, or navigate between different frames. This step allows you to assess the quality of the PT data and prepare for further analysis or registration with other modalities.',
      },
      {
        id: 'registration',
        name: 'Registration',
        layout: defaultLayout,
        toolbarButtons: defaultButtons,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'registration',
        },
        info: 'The Registration step provides a comprehensive view of the CT, PT, and fused CT-PT volume data in multiple orientations. The fusion viewports display the CT and PT volumes overlaid, allowing you to visually assess the alignment and registration between the two modalities. The individual CT and PT viewports are also available for side-by-side comparison. This step is crucial for ensuring proper registration before proceeding with further analysis or quantification.',
      },
      {
        id: 'roiQuantification',
        name: 'ROI Quantification',
        layout: {
          panels: {
            left: defaultLeftPanel,
            right: [[dynamicVolume.segmentation]],
          },
          options: {
            leftPanelClosed: false,
            rightPanelClosed: false,
          },
        },
        toolbarButtons: [...defaultButtons, ...ROIThresholdToolbox],
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'roiQuantification',
        },
        info: 'The ROI quantification step allows you to define regions of interest (ROIs) with labelmap segmentations, on the fused CT-PT volume data using the labelmap tools. The left panel provides controls for adjusting the dynamic volume visualization, while the right panel offers tools for segmentation, editing, and exporting the ROI data. This step enables you to quantify the uptake or other measures within the defined ROIs for further analysis.',
      },
      {
        id: 'kineticAnalysis',
        name: 'Kinetic Analysis',
        layout: defaultLayout,
        toolbarButtons: defaultButtons,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'kineticAnalysis',
        },
        onEnter: [
          {
            commandName: 'updateSegmentationsChartDisplaySet',
            options: { servicesManager },
          },
        ],
        info: 'The Kinetic Analysis step provides a comprehensive view for visualizing and analyzing the dynamic data derived from the ROI segmentations. The fusion viewports display the combined CT-PT volume data, while a dedicated viewport shows a series chart representing the data over time. This step allows you to explore the temporal dynamics of the uptake or other kinetic measures within the defined regions of interest, enabling further quantitative analysis and modeling.',
      },
    ],
  };
}

export { getWorkflowSettings as default };
