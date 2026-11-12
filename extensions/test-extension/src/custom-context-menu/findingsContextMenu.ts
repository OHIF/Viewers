export default {
  measurementsContextMenu: {
    $set: {
      inheritsFrom: 'ohif.contextMenu',
      menus: [
        {
          // selector restricts context menu to when there is nearbyToolData
          selector: ({ nearbyToolData }) => !!nearbyToolData,
          items: [
            {
              label: 'Site',
              actionType: 'ShowSubMenu',
              subMenu: 'siteSelectionSubMenu',
            },
            {
              label: 'Finding',
              actionType: 'ShowSubMenu',
              subMenu: 'findingSelectionSubMenu',
            },
            {
              // inheritsFrom is implicit here in the configuration setup
              label: 'Delete Measurement',
              commands: [
                {
                  commandName: 'removeMeasurement',
                },
              ],
            },
            {
              label: 'Add Label',
              commands: [
                {
                  commandName: 'setMeasurementLabel',
                },
              ],
            },

            // The example below shows how to include a delegating sub-menu,
            // Only available on the @ohif/mnGrid hanging protocol
            // To demonstrate, select the 3x1 layout from the protocol menu
            // and right click on a measurement.
            {
              label: 'IncludeSubMenu',
              selector: ({ protocol }) => protocol?.id === '@ohif/mnGrid',
              delegating: true,
              subMenu: 'orientationSelectionSubMenu',
            },
          ],
        },

        {
          id: 'orientationSelectionSubMenu',
          selector: ({ nearbyToolData }) => !!nearbyToolData,
          items: [
            {
              inheritsFrom: '@ohif/contextMenuAnnotationCode',
              code: 'SCT:24422004',
            },
            {
              inheritsFrom: '@ohif/contextMenuAnnotationCode',
              code: 'SCT:81654009',
            },
          ],
        },

        {
          id: 'findingSelectionSubMenu',
          selector: ({ nearbyToolData }) => !!nearbyToolData,
          items: [
            {
              inheritsFrom: '@ohif/contextMenuAnnotationCode',
              code: 'SCT:371861004',
            },
            {
              inheritsFrom: '@ohif/contextMenuAnnotationCode',
              code: 'SCT:194983005',
            },
          ],
        },

        {
          id: 'siteSelectionSubMenu',
          selector: ({ nearbyToolData }) => !!nearbyToolData,
          items: [
            {
              inheritsFrom: '@ohif/contextMenuAnnotationCode',
              code: 'SCT:69536005',
            },
            {
              inheritsFrom: '@ohif/contextMenuAnnotationCode',
              code: 'SCT:45048000',
            },
          ],
        },
      ],
    },
  },
};
