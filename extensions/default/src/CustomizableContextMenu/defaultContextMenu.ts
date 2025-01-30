const defaultContextMenu = {
  id: 'measurementsContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    // Get the items from the UI Customization for the menu name (and have a custom name)
    {
      id: 'forCustomMeasurement',
      selector: ({ value, nearbyToolData }) =>
        !!nearbyToolData &&
        !value.data.handles.headName?.includes('custom_point') &&
        value.data.handles.headName,
      items: [
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
    {
      id: 'forPredictedMeasurement',
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
