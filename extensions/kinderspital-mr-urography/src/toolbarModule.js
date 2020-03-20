import TOOL_NAMES from './tools/toolNames';

const TOOLBAR_BUTTON_TYPES = {
  SET_TOOL_ACTIVE: 'setToolActive',
};

const definitions = [
  {
    id: 'mrUrographyDropDown',
    label: 'Urography',
    icon: 'ellipse-circle',
    buttons: [
      {
        id: 'Freehand',
        label: 'Draw',
        icon: 'ellipse-circle',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL },
      },
      {
        id: 'FreehandSculptor',
        label: 'Edit',
        icon: 'ellipse-circle',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_SCULPTOR_TOOL,
        },
      },
    ],
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
