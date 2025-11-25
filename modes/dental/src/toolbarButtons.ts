import i18n from 'i18next';

// Using untyped array to avoid cross-package type resolution issues in dental mode
const dentalMeasurementButtons = [
  {
    id: 'DentalMeasurementTools',
    uiType: 'ohif.toolButtonList',
    props: { buttonSection: true },
  },
  {
    id: 'PALength',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'PA length',
      tooltip: 'Periapical length (mm)',
      commands: {
        commandName: 'activateDentalMeasurement',
        commandOptions: { toolName: 'Length', label: 'PA length' },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CanalAngle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'Canal angle',
      tooltip: 'Canal angle (°)',
      commands: {
        commandName: 'activateDentalMeasurement',
        commandOptions: { toolName: 'Angle', label: 'Canal angle' },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CrownWidth',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Crown width',
      tooltip: 'Crown width (mm)',
      commands: {
        commandName: 'activateDentalMeasurement',
        commandOptions: { toolName: 'Length', label: 'Crown width' },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'RootLength',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Root length',
      tooltip: 'Root length (mm)',
      commands: {
        commandName: 'activateDentalMeasurement',
        commandOptions: { toolName: 'Length', label: 'Root length' },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'ClearViewport',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-reset',
      label: 'Clear',
      tooltip: 'Clear active viewport images and measurements',
      commands: {
        commandName: 'clearActiveViewport',
      },
    },
  },
];

export default dentalMeasurementButtons;
