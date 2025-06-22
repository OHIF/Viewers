// import { id } from './id';
// import MyPanel from './MyPanel';
// import { Types as ExtensionTypes } from '@ohif/core';
// import React from 'react'; // ✅ required for JSX

// const getPanelModule = ({
//   servicesManager,
//   commandsManager,
//   extensionManager,
// }: ExtensionTypes.ExtensionsManagerParams) => {
//   return [
//     {
//       name: 'aiSegmentation',
//       iconName: 'tab-linear',
//       iconColor: '#4CAF50',
//       iconType: 'linear',
//       iconSize: '1.5em',
//       iconClass: 'icon-tab-linear',
//       iconLabel: 'AI Segmentation',
//       label: 'AI Segmentation',
//       component: () => <MyPanel servicesManager={servicesManager} />,
//     },
//   ];
// };

// export default {
//   id,

//   preRegistration: ({
//     servicesManager,
//     commandsManager,
//     configuration = {},
//   }: ExtensionTypes.ExtensionsManagerParams & { configuration?: Record<string, unknown> }) => {},

//   getPanelModule,
//   getViewportModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getToolbarModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getLayoutTemplateModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getSopClassHandlerModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getHangingProtocolModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getCommandsModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getContextModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},

//   getDataSourcesModule: ({
//     servicesManager,
//     commandsManager,
//     extensionManager,
//   }: ExtensionTypes.ExtensionsManagerParams) => {},
// };

import { id } from './id';
import MyPanel from './MyPanel';
import React from 'react'; // ✅ required for JSX

const getPanelModule = ({ servicesManager }) => {
  return [
    {
      name: 'aiSegmentation',
      iconName: 'tab-linear',
      iconColor: '#4CAF50',
      iconType: 'linear',
      iconSize: '1.5em',
      iconClass: 'icon-tab-linear',
      iconLabel: 'AI Segmentation',
      label: 'AI Segmentation',
      component: () => <MyPanel servicesManager={servicesManager} />,
    },
  ];
};

export default {
  id,
  getPanelModule,
};
