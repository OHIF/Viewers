import toolbarButtons from './toolbarButtons';

const dynamicVolume = {
  sopClassHandler:
    '@ohif/extension-cornerstone-dynamic-volume.sopClassHandlerModule.dynamic-volume',
  leftPanel: '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
  rightPanel: '@ohif/extension-cornerstone-dynamic-volume.panelModule.ROISegmentation',
};

function getWorkflowSettings(appContext) {
  const defaultPanels = {
    left: [dynamicVolume.leftPanel],
    right: [],
  };

  const defaultLayout = { panels: defaultPanels };

  const defaultToolbar = {
    buttons: toolbarButtons,
    sections: [
      {
        key: 'primary',
        buttons: [
          'MeasurementTools',
          'Zoom',
          'WindowLevel',
          'Crosshairs',
          'Pan',
          'fusionPTColormap',
          'Cine',
        ],
      },
    ],
  };

  const roiQuantificationToolbar = JSON.parse(JSON.stringify(defaultToolbar));

  // Add segmentation tools to ROI Quantification step
  roiQuantificationToolbar.sections
    .find(s => s.key === 'primary')
    .buttons.push('SegmentationTools');

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
        toolbar: defaultToolbar,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'dataPreparation',
        },
      },
      {
        id: 'registration',
        name: 'Registration',
        layout: defaultLayout,
        toolbar: defaultToolbar,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'registration',
        },
      },
      {
        id: 'review',
        name: 'Review',
        layout: defaultLayout,
        toolbar: defaultToolbar,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'review',
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
        toolbar: roiQuantificationToolbar,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'roiQuantification',
        },
      },
      {
        id: 'kineticAnalysis',
        name: 'Kinect Analysis',
        layout: defaultLayout,
        toolbar: defaultToolbar,
        hangingProtocol: {
          protocolId: 'default4D',
          stageId: 'kinectAnalysis',
        },
        onEnter: [
          {
            commandName: 'updateSegmentationsChartDisplaySet',
            options: { appContext },
          },
        ],
      },
    ],
  };
}

export { getWorkflowSettings as default };
