const defaultContextMenu = {
  id: 'measurementsContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    // Get the items from the UI Customization for the menu name (and have a custom name)
    {
      id: 'forPredictedMeasurement',
      selector: ({ value, nearbyToolData }) =>
        !!nearbyToolData &&
        value.data.handles.points.length !== 4 &&
        !value.data.handles.name?.includes('custom_point'),
      items: [
        {
          label: 'Delete measurement',
          tooltip: 'Deletion is not allowed on this prediction',
          disabled: true,
          commands: [
            {
              commandName: '',
            },
          ],
        },
      ],
    },
    {
      id: 'forRadiolucentBoxes',
      selector: ({ value, nearbyToolData }) =>
        !!nearbyToolData &&
        value.data.handles.points.length === 4 &&
        value.data.handles.name &&
        !value.data.handles.name?.includes('custom_point'),
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
      id: 'forCustomMeasurement',
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
