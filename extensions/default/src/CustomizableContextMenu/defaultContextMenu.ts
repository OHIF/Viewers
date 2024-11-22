const defaultContextMenu = {
  id: 'measurementsContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    // Get the items from the UI Customization for the menu name (and have a custom name)
    {
      id: 'forExistingMeasurement',
      selector: ({ nearbyToolData }) => !!nearbyToolData,
      items: [
        {
          label: 'Link to an imaging data',
          commands: [
            {
              commandName: 'linkMeasurement',
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
        {
          label: 'Delete measurement',
          commands: [
            {
              commandName: 'deleteMeasurement',
            },
          ],
        },
      ],
    },
  ],
};

export default defaultContextMenu;
