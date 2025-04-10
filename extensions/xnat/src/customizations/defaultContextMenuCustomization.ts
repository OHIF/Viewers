export default {
  measurementsContextMenu: {
    inheritsFrom: 'ohif.contextMenu',
    menus: [
      // Get the items from the UI Customization for the menu name (and have a custom name)
      {
        id: 'forExistingMeasurement',
        selector: ({ nearbyToolData }) => !!nearbyToolData,
        items: [
          {
            label: 'Delete measurement',
            commands: 'deleteMeasurement',
          },
          {
            label: 'Add Label',
            commands: 'setMeasurementLabel',
          },
        ],
      },
    ],
  },
};
