export default {
  cornerstoneViewportClickCommands: {
    doubleClick: ['toggleOneUp'],
    button1: ['closeContextMenu'],
    button3: [
      {
        commandName: 'showCornerstoneContextMenu',
        commandOptions: {
          requireNearbyToolData: true,
          menuId: 'measurementsContextMenu',
        },
      },
    ],
  },
};
