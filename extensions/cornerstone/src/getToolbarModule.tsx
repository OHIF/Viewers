export default function getToolbarModule({ commandsManager, servicesManager }) {
  const { toolGroupService, hangingProtocolService, displaySetService, viewportGridService } =
    servicesManager.services;

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
      name: 'evaluate.action',
      evaluate: ({ viewportId, button }) => {
        return {
          className: 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
    {
      name: 'evaluate.mpr',
      evaluate: ({ viewportId, button }) => {
        const { protocol } = hangingProtocolService.getActiveProtocol();

        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);

        const areReconstructable = displaySets.every(displaySet => {
          return displaySet.isReconstructable;
        });

        if (!areReconstructable) {
          return {
            disabled: true,
            classNames: 'ohif-disabled',
          };
        }

        const isMpr = protocol?.id === 'mpr';

        return {
          disabled: false,
          className: isMpr
            ? '!text-[#348CFD]'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
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
