export const studyBrowserContextMenu = {
  id: 'StudyBrowser.studyContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    {
      id: 'studyBrowserContextMenu',
      // selector restricts context menu to when there is nearbyToolData
      items: [
        {
          // customizationType is implicit here in the configuration setup
          label: 'Show in other monitor',
          selector: ({ isMultimonitor }) => isMultimonitor,
          commands: [
            {
              commandName: 'multimonitor',
              commandOptions: {
                commands: [
                  {
                    commandName: 'loadStudy',
                  },
                  {
                    commandName: 'setHangingProtocol',
                    commandOptions: {
                      protocolId: '@ohif/mnGrid',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

export default studyBrowserContextMenu;
