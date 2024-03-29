const dynamicVolume = {
  sopClassHandler:
    '@ohif/extension-cornerstone-dynamic-volume.sopClassHandlerModule.dynamic-volume',
  leftPanel: '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
  rightPanel: '@ohif/extension-cornerstone-dynamic-volume.panelModule.ROISegmentation',
};

const defaultButtons = {
  buttonSection: 'primary',
  buttons: [
    'MeasurementTools',
    'Zoom',
    'WindowLevel',
    'Crosshairs',
    'Pan',
    'fusionPTColormap',
    'Cine',
  ],
};

const defaultPanels = {
  left: [dynamicVolume.leftPanel],
  right: [],
};

const defaultLayout = { panels: defaultPanels };

function getWorkflowSettings({ servicesManager }) {
  return {
    steps: [
      {
        id: 'dataPreparation',
        name: 'Data Preparation',
        layout: {
          panels: {
            left: [dynamicVolume.leftPanel],
          },
        },
        toolbarButtons: defaultButtons,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'dataPreparation',
        },
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
      },
      {
        id: 'roiQuantification',
        name: 'ROI Quantification',
        layout: {
          panels: {
            left: [dynamicVolume.leftPanel],
            right: [dynamicVolume.rightPanel],
          },
        },
        toolbarButtons: [
          defaultButtons,
          {
            buttonSection: 'primary',
            buttons: ['SegmentationTools'],
          },
        ],
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'roiQuantification',
        },
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
      },
    ],
  };
}

export { getWorkflowSettings as default };
