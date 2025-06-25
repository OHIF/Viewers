export default {
  measurementsContextMenu: {
    inheritsFrom: 'ohif.contextMenu',
    menus: [
      // Get the items from the UI Customization for the menu name (and have a custom name)
      {
        id: 'forExistingMeasurement',
        selector: ({ value, nearbyToolData }) =>
          !!nearbyToolData &&
          value.data.handles.points.length !== 4 &&
          value.data.handles.name &&
          !value.data.handles.name?.includes('custom_point'),
        items: [
          {
            id: 'disabledDeletePrediction',
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
          (!!nearbyToolData &&
            value.data.handles.points.length === 4 &&
            value.data.handles.name &&
            !value.data.handles.name?.includes('custom_point')) ||
          (!!nearbyToolData && value.data.handles.points.length === 1),
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
  },
};
