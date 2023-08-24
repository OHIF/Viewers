const dynamicVolume = {
  sopClassHandler:
    '@ohif/extension-cornerstone-dynamic-volume.sopClassHandlerModule.dynamic-volume',
  leftPanel:
    '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
  rightPanel:
    '@ohif/extension-cornerstone-dynamic-volume.panelModule.ROISegmentation',
};

const defaultPanels = {
  left: [dynamicVolume.leftPanel],
  right: [],
};

const defaultLayout = { panels: defaultPanels };

const workflowSettings = {
  steps: [
    {
      id: 'dataPreparation',
      name: 'Data Preparation',
      layout: {
        panels: {
          left: [dynamicVolume.leftPanel],
        },
      },
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'dataPreparation',
      },
    },
    {
      id: 'registration',
      name: 'Registration',
      layout: defaultLayout,
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'registration',
      },
    },
    {
      id: 'review',
      name: 'Review',
      layout: defaultLayout,
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
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'roiQuantification',
      },
    },
    {
      id: 'kineticAnalysis',
      name: 'Kinect Analysis',
      layout: defaultLayout,
      hangingProtocol: {
        protocolId: 'default4D',
        stageId: 'kinectAnalysis',
      },
      onBeforeActivate: ({ extensionManager, servicesManager }) => {
        const sopClassHandler = extensionManager.getModuleEntry(
          dynamicVolume.sopClassHandler
        );

        sopClassHandler.updateSegmentationsDisplaySets();
      },
    },
  ],
};

export { workflowSettings as default };
