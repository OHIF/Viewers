export default {
  'studyBrowser.studyMenuItems': {
    $push: [
      {
        id: 'applyHangingProtocol',
        label: 'Apply Hanging Protocol',
        iconName: 'ViewportViews',
        items: [
          {
            id: 'applyDefaultProtocol',
            label: 'Default',
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'default',
                },
              },
            ],
          },
          {
            id: 'applyMPRViewer',
            label: 'MPR',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'mpr',
                },
              },
            ],
          },
          {
            id: 'applyMPR3DViewer',
            label: 'MPR + 3D',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'mprAnd3DVolumeViewport',
                },
              },
            ],
          },
          {
            id: 'apply3DOnly',
            label: '3D Only',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'only3D',
                },
              },
            ],
          },
          {
            id: 'applyMain3D',
            label: '3D Main',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'main3D',
                },
              },
            ],
          },
          {
            id: 'applyPrimary3D',
            label: 'Primary 3D',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'primary3D',
                },
              },
            ],
          },
          {
            id: 'applyFourUp',
            label: 'Four Up',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'fourUp',
                },
              },
            ],
          },
          {
            id: 'applyPrimaryAxial',
            label: 'Primary Axial',
            selector: () => true,
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: 'primaryAxial',
                },
              },
            ],
          },
          {
            id: 'apply2x2Grid',
            label: '2x2 Grid',
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: '@ohif/mnGrid',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'showInOtherMonitor',
        label: 'Launch On Second Monitor',
        iconName: 'DicomTagBrowser',
        selector: ({ servicesManager }) => {
          const { multiMonitorService } = servicesManager.services;
          return multiMonitorService.isMultimonitor;
        },
        commands: {
          commandName: 'multimonitor',
          commandOptions: {
            hashParams: '&hangingProtocolId=@ohif/mnGrid8',
            commands: [
              'loadStudy',
              {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: '@ohif/mnGrid8',
                },
              },
            ],
          },
        },
      },
    ],
  },
};
