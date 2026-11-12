import type { Button } from '@ohif/core/types';
import i18n from 'i18next';

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
      label: i18n.t('Buttons:Line'),
      tooltip: i18n.t('Buttons:Line Tool'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'point',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-point',
      label: i18n.t('Buttons:Point'),
      tooltip: i18n.t('Buttons:Point Tool'),
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
      label: i18n.t('Buttons:Polygon'),
      tooltip: i18n.t('Buttons:Polygon Tool'),
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
      label: i18n.t('Buttons:Circle'),
      tooltip: i18n.t('Buttons:Circle Tool'),
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
      label: i18n.t('Buttons:Box'),
      tooltip: i18n.t('Buttons:Box Tool'),
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
      label: i18n.t('Buttons:Freehand Polygon'),
      tooltip: i18n.t('Buttons:Freehand Polygon Tool'),
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
      label: i18n.t('Buttons:Freehand Line'),
      tooltip: i18n.t('Buttons:Freehand Line Tool'),
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
      label: i18n.t('Buttons:Pan'),
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
      label: i18n.t('Buttons:Dicom Tag Browser'),
      tooltip: i18n.t('Buttons:Dicom Tag Browser'),
      commands: 'openDICOMTagViewer',
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
