export const studyBrowserContextMenu = {
  id: 'StudyBrowser.studyContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    {
      id: 'studyBrowserContextMenu',
      // selector restricts context menu to when there is nearbyToolData
      items: [
        {
          label: 'Show in Grid',
          commands: {
            commandName: 'loadStudy',
            commandOptions: {
              commands: {
                commandName: 'setHangingProtocol',
                commandOptions: {
                  protocolId: '@ohif/mnGrid8',
                },
              },
            },
          },
        },
        {
          label: 'Show in other monitor',
          selector: ({ isMultimonitor }) => isMultimonitor,
          commands: {
            commandName: 'multimonitor',
            commandOptions: {
              commands: {
                commandName: 'loadStudy',
                commandOptions: {
                  commands: {
                    commandName: 'setHangingProtocol',
                    commandOptions: {
                      protocolId: '@ohif/mnGrid8',
                    },
                  },
                },
              },
            },
          },
        },
        {
          label: 'Compare All',
          selector: ({ isMultimonitor }) => isMultimonitor,
          commands: [
            {
              commandName: 'loadStudy',
              commandOptions: {
                commands: {
                  commandName: 'setHangingProtocol',
                  commandOptions: {
                    protocolId: '@ohif/mnGrid',
                  },
                },
              },
            },
            {
              commandName: 'multimonitor',
              commandOptions: {
                commands: {
                  commandName: 'loadStudy',
                  commandOptions: {
                    commands: {
                      commandName: 'setHangingProtocol',
                      commandOptions: {
                        protocolId: '@ohif/mnGridMonitor2',
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

export default studyBrowserContextMenu;
