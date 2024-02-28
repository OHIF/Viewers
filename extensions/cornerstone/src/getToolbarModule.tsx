export default function getToolbarModule({ commandsManager, servicesManager }) {
  const { toolGroupService } = servicesManager.services;

  return [
    // functions/helpers to be used by the toolbar buttons to decide if they should
    // enabled or not
    {
      name: 'evaluate.CornerstoneTool',
      evaluate: ({ viewportId, button }) => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
        const toolName = getToolNameForButton(button);

        if (!toolGroup || !toolGroup.hasTool(toolName)) {
          return {
            disabled: true,
            classNames: 'ohif-disabled',
          };
        }

        const isPrimaryActive = toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          className: isPrimaryActive
            ? 'text-black bg-primary-light'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
    {
      name: 'evaluate.CornerstoneToggle',
      evaluate: ({ viewportId, button }) => {
        return {
          isActive: true,
        };
      },
    },
  ];
}

function getToolNameForButton(button) {
  const { props } = button;
  const { commands } = props;
  if (commands && commands.length) {
    const command = commands[0];
    const { commandOptions } = command;
    const { toolName } = commandOptions;
    return toolName;
  }
  return null;
}
