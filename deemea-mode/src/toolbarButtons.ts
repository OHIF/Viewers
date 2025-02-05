// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import type { Button } from '@ohif/core/types';

export const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const toolbarButtons: Button[] = [
  {
    id: 'ResetButton',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'icon-transferring',
      label: 'Reset predictions',
      commands: {
        commandName: 'resetPoints',
        context: 'VIEWER',
      },
    },
  },
  {
    id: 'Length',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-length',
      label: 'Length',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'RectangleROI',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-rectangle',
      label: 'Rectangle',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Angle',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-angle',
      label: 'Angle',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Probe',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-probe',
      label: 'Probe',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-calibration',
      label: 'Calibration',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Window Level
  {
    id: 'WindowLevel',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-window-level',
      label: 'Window Level',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Pan...
  {
    id: 'Pan',
    uiType: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-reset',
      tooltip: 'Reset View',
      label: 'Reset image position',
      commands: [
        {
          commandName: 'resetViewport',
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
