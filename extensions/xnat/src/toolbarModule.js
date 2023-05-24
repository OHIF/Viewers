import { PEPPERMINT_TOOL_NAMES } from './peppermint-tools';
import { AIAA_TOOL_NAMES } from  './aiaa-tools';

const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

const definitions = [
  // {
  //   id: 'freehandRoiTools',
  //   label: 'Contour',
  //   icon: 'xnat-contour',
  //   buttons: [
  //     {
  //       id: 'FreehandRoi',
  //       label: 'Draw',
  //       icon: 'xnat-contour-freehand',
  //       type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
  //       commandName: 'setToolActive',
  //       commandOptions: { toolName: PEPPERMINT_TOOL_NAMES.FREEHAND_ROI_3D_TOOL },
  //     },
  //     {
  //       id: 'FreehandRoiSculptor',
  //       label: 'Sculpt',
  //       icon: 'xnat-contour-freehand-sculpt',
  //       type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
  //       commandName: 'setToolActive',
  //       commandOptions: { toolName: PEPPERMINT_TOOL_NAMES.FREEHAND_ROI_3D_SCULPTOR_TOOL },
  //     },
  //   ],
  // },
  {
    id: 'brushTools',
    label: 'Mask',
    icon: 'xnat-mask',
    buttons: [
      {
        id: 'Brush',
        label: 'Manual',
        icon: 'xnat-mask-manual',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: PEPPERMINT_TOOL_NAMES.BRUSH_3D_TOOL },
      },
      {
        id: 'Brush3DHUGatedTool',
        label: 'Smart CT',
        icon: 'xnat-mask-smart-ct',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.BRUSH_3D_HU_GATED_TOOL,
        },
      },
      {
        id: 'Brush3DAutoGatedTool',
        label: 'Auto',
        icon: 'xnat-mask-auto',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.BRUSH_3D_AUTO_GATED_TOOL,
        },
      },
      // {
      //   id: 'NVIDIAClaraAIAA',
      //   label: 'NVIDIA AIAA',
      //   icon: 'dot-circle',
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: AIAA_TOOL_NAMES.AIAA_PROB_TOOL },
      //   experimentalFeature: true,
      // },
      {
        id: 'CircleScissors',
        label: 'Circle',
        icon: 'circle',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.XNAT_CIRCLE_SCISSORS_TOOL,
        },
      },
      {
        id: 'RectangleScissors',
        label: 'Rectangle',
        icon: 'stop',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.XNAT_RECTANGLE_SCISSORS_TOOL,
        },
      },
      {
        id: 'FreehandScissors',
        label: 'Freehand',
        icon: 'inline-edit',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.XNAT_FREEHAND_SCISSORS_TOOL,
        },
      },
      {
        id: 'SphericalBrush',
        label: 'Spherical',
        icon: 'sphere',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.XNAT_SPHERICAL_BRUSH_TOOL,
        },
      },
      {
        id: 'CorrectionScissors',
        label: 'Correction',
        icon: 'scissors',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: {
          toolName: PEPPERMINT_TOOL_NAMES.XNAT_CORRECTION_SCISSORS_TOOL,
        },
      },
      {
        id: 'BrushEraser',
        label: 'Eraser',
        icon: 'xnat-brush-eraser',
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'BrushEraser' },
      },
      {
        id: 'BrushUndo',
        label: 'Undo',
        icon: 'xnat-undo',
        type: TOOLBAR_BUTTON_TYPES.COMMAND,
        commandName: 'undo',
      },
      {
        id: 'BrushRedo',
        label: 'Redo',
        icon: 'xnat-redo',
        type: TOOLBAR_BUTTON_TYPES.COMMAND,
        commandName: 'redo',
      },
    ],
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
