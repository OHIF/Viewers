// Visible?
// Disabled?
// Based on contexts or misc. criteria?
//  -- ACTIVE_ROUTE::VIEWER
//  -- ACTIVE_VIEWPORT::CORNERSTONE
// setToolActive commands should receive the button event that triggered
// so we can do the "bind to this button" magic

// const definitions = [
//   // OLD
//   {
//     id: 'StackScroll',
//     label: 'Stack Scroll',
//     icon: 'bars',
//     //
//     type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
//     commandName: 'setToolActive',
//     commandOptions: { toolName: 'StackScroll' },
//   },
//   {
//     id: 'Reset',
//     label: 'Reset',
//     icon: 'reset',
//     //
//     type: TOOLBAR_BUTTON_TYPES.COMMAND,
//     commandName: 'resetViewport',
//   },
//   {
//     id: 'Cine',
//     label: 'CINE',
//     icon: 'youtube',
//     //
//     type: TOOLBAR_BUTTON_TYPES.BUILT_IN,
//     options: {
//       behavior: TOOLBAR_BUTTON_BEHAVIORS.CINE,
//     },
//   },
//   {
//     id: 'More',
//     label: 'More',
//     icon: 'ellipse-circle',
//     buttons: [
//       {
//         id: 'Magnify',
//         label: 'Magnify',
//         icon: 'circle',
//         //
//         type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
//         commandName: 'setToolActive',
//         commandOptions: { toolName: 'Magnify' },
//       },
//       {
//         id: 'WwwcRegion',
//         label: 'ROI Window',
//         icon: 'stop',
//         //
//         type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
//         commandName: 'setToolActive',
//         commandOptions: { toolName: 'WwwcRegion' },
//       },
//       {
//         id: 'Invert',
//         label: 'Invert',
//         icon: 'adjust',
//         //
//         type: TOOLBAR_BUTTON_TYPES.COMMAND,
//         commandName: 'invertViewport',
//       },
//       {
//         id: 'RotateRight',
//         label: 'Rotate Right',
//         icon: 'rotate-right',
//         //
//         type: TOOLBAR_BUTTON_TYPES.COMMAND,
//         commandName: 'rotateViewportCW',
//       },
//       {
//         id: 'FlipH',
//         label: 'Flip H',
//         icon: 'ellipse-h',
//         //
//         type: TOOLBAR_BUTTON_TYPES.COMMAND,
//         commandName: 'flipViewportHorizontal',
//       },
//       {
//         id: 'FlipV',
//         label: 'Flip V',
//         icon: 'ellipse-v',
//         //
//         type: TOOLBAR_BUTTON_TYPES.COMMAND,
//         commandName: 'flipViewportVertical',
//       },
//       {
//         id: 'Clear',
//         label: 'Clear',
//         icon: 'trash',
//         //
//         type: TOOLBAR_BUTTON_TYPES.COMMAND,
//         commandName: 'clearAnnotations',
//       },
//       {
//         id: 'Eraser',
//         label: 'Eraser',
//         icon: 'eraser',
//         //
//         type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
//         commandName: 'setToolActive',
//         commandOptions: { toolName: 'Eraser' },
//       },
//     ],
//   },
//   {
//     id: 'Exit2DMPR',
//     label: 'Exit 2D MPR',
//     icon: 'times',
//     //
//     type: TOOLBAR_BUTTON_TYPES.COMMAND,
//     commandName: 'setCornerstoneLayout',
//     context: 'ACTIVE_VIEWPORT::VTK',
//   },
// ];

export default [];
