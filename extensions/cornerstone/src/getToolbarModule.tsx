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
            className: 'ohif-disabled',
          };
        }

        const isPrimaryActive = toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          className: isPrimaryActive
            ? 'text-black bg-primary-light'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
          // Todo: isActive right now is used for nested buttons where the primary
          // button needs to be fully rounded (vs partial rounded) when active
          // otherwise it does not have any other use
          isActive: isPrimaryActive,
        };
      },
    },
    {
      name: 'evaluate.group',
      evaluate: ({ viewportId, button }) => {
        const { primary, items } = button.props;

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
        const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

        // check if the active toolName is part of the items then we need
        // to move it to the primary button
        const activeToolIndex = items.findIndex(item => {
          const toolName = getToolNameForButton(item);
          return toolName === activeToolName;
        });

        if (activeToolIndex === -1) {
          return {
            primary,
            items,
          };
        }

        const activeToolProps = items[activeToolIndex];

        return {
          primary: activeToolProps,
          items,
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
            className: 'ohif-disabled',
          };
        }

        const isMpr = protocol?.id === 'mpr';

        return {
          disabled: false,
          className: isMpr
            ? 'text-black bg-primary-light'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
  ];
}

function getToolNameForButton(button) {
  const { props } = button;

  const commands = props?.commands || button.commands;

  if (commands && commands.length) {
    const command = commands[0];
    const { commandOptions } = command;
    const { toolName } = commandOptions;
    return toolName;
  }
  return null;
}
