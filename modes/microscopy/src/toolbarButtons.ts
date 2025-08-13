import type { Button } from '@ohif/core/types';

export const setToolActiveToolbar = {
  commandName: 'setToolActive',
  commandOptions: {
    toolName: 'line',
  },
  context: 'MICROSCOPY',
};

const toolbarButtons: Button[] = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'line',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Line',
      tooltip: 'Line',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'point',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-point',
      label: 'Point',
      tooltip: 'Point Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'point' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'polygon',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-polygon',
      label: 'Polygon',
      tooltip: 'Polygon Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'polygon' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'circle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-circle',
      label: 'Circle',
      tooltip: 'Circle Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'circle' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'box',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rectangle',
      label: 'Box',
      tooltip: 'Box Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'box' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'freehandpolygon',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-freehand-polygon',
      label: 'Freehand Polygon',
      tooltip: 'Freehand Polygon Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'freehandpolygon' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'freehandline',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-freehand-line',
      label: 'Freehand Line',
      tooltip: 'Freehand Line Tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'freehandline' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'dragPan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: { toolName: 'dragPan' },
      },
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'TagBrowser',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'dicom-tag-browser',
      label: 'Dicom Tag Browser',
      tooltip: 'Dicom Tag Browser',
      commands: 'openDICOMTagViewer',
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
