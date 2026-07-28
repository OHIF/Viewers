// Deliberately untyped: annotating with the `Button` type would import
// @ohif/core in a standalone scaffold, which does not install its peers
// (auto-install-peers=false). Shape reference: @ohif/core/types Button.
export const setToolActiveToolbar = {
  commandName: 'setToolActive',
  commandOptions: {
    toolGroupIds: ['default', 'mpr'],
  },
  context: 'CORNERSTONE',
};

const toolbarButtons = [
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-window-level',
      label: 'Window Level',
      tooltip: 'Window Level',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'WindowLevel',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      tooltip: 'Pan',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Pan',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      tooltip: 'Zoom',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Zoom',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
];

export default toolbarButtons;
