import { Enums } from '@cornerstonejs/tools';

const getToggledClassName = (isToggled: boolean) => {
  return isToggled
    ? '!text-primary-active'
    : '!text-common-bright hover:!bg-primary-dark hover:text-primary-light';
};

export default function getToolbarModule({ commandsManager, servicesManager }) {
  const {
    toolGroupService,
    syncGroupService,
    cornerstoneViewportService,
    hangingProtocolService,
    displaySetService,
    viewportGridService,
  } = servicesManager.services;

  return [
    // functions/helpers to be used by the toolbar buttons to decide if they should
    // enabled or not
    {
      name: 'evaluate.cornerstoneTool',
      evaluate: ({ viewportId, button, disabledText }) => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return;
        }

        const toolName = getToolNameForButton(button);

        if (!toolGroup || !toolGroup.hasTool(toolName)) {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const isPrimaryActive = toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          className: isPrimaryActive
            ? '!text-black bg-primary-light'
            : '!text-common-bright hover:!bg-primary-dark hover:!text-primary-light',
          // Todo: isActive right now is used for nested buttons where the primary
          // button needs to be fully rounded (vs partial rounded) when active
          // otherwise it does not have any other use
          isActive: isPrimaryActive,
        };
      },
    },
    {
      name: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      evaluate: ({ viewportId, button, itemId }) => {
        const { items } = button.props;

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return {
            primary: button.props.primary,
            items,
          };
        }

        const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

        // check if the active toolName is part of the items then we need
        // to move it to the primary button
        const activeToolIndex = items.findIndex(item => {
          const toolName = getToolNameForButton(item);
          return toolName === activeToolName;
        });

        // if there is an active tool in the items dropdown bound to the primary mouse/touch
        // we should show that no matter what
        if (activeToolIndex > -1) {
          return {
            primary: items[activeToolIndex],
            items,
          };
        }

        if (!itemId) {
          return {
            primary: button.props.primary,
            items,
          };
        }

        // other wise we can move the clicked tool to the primary button
        const clickedItemProps = items.find(item => item.id === itemId || item.itemId === itemId);

        return {
          primary: clickedItemProps,
          items,
        };
      },
    },
    {
      name: 'evaluate.action',
      evaluate: ({ viewportId, button }) => {
        return {
          className: '!text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
    {
      name: 'evaluate.cornerstoneTool.toggle',
      evaluate: ({ viewportId, button, disabledText }) => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return;
        }
        const toolName = getToolNameForButton(button);

        if (!toolGroup || !toolGroup.hasTool(toolName)) {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const isOff = [Enums.ToolModes.Disabled, Enums.ToolModes.Passive].includes(
          toolGroup.getToolOptions(toolName).mode
        );

        return {
          className: getToggledClassName(!isOff),
        };
      },
    },
    {
      name: 'evaluate.cornerstone.synchronizer',
      evaluate: ({ viewportId, button }) => {
        let synchronizers = syncGroupService.getSynchronizersForViewport(viewportId);

        if (!synchronizers?.length) {
          return {
            className: getToggledClassName(false),
          };
        }

        const synchronizerType = button?.commands?.[0]?.commandOptions?.type;

        synchronizers = syncGroupService.getSynchronizersOfType(synchronizerType);

        if (!synchronizers?.length) {
          return {
            className: getToggledClassName(false),
          };
        }

        // Todo: we need a better way to find the synchronizers based on their
        // type, but for now we just check the first one and see if it is
        // enabled
        const synchronizer = synchronizers[0];

        const isEnabled = synchronizer?._enabled;

        return {
          className: getToggledClassName(isEnabled),
        };
      },
    },
    {
      name: 'evaluate.not3D',
      evaluate: ({ viewportId, disabledText }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (viewport?.type === 'volume3d') {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }
      },
    },
    {
      name: 'evaluate.isUS',
      evaluate: ({ viewportId, disabledText }) => {
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        if (!displaySetUIDs?.length) {
          return;
        }

        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);
        const isUS = displaySets.some(displaySet => displaySet.Modality === 'US');
        if (!isUS) {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }
      },
    },
    {
      name: 'evaluate.viewportProperties.toggle',
      evaluate: ({ viewportId, button }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport || viewport.isDisabled) {
          return;
        }

        const propId = button.id;

        const properties = viewport.getProperties();
        const camera = viewport.getCamera();

        const prop = camera?.[propId] || properties?.[propId];

        if (!prop) {
          return {
            disabled: false,
            className: '!text-common-bright hover:!bg-primary-dark hover:text-primary-light',
          };
        }

        const isToggled = prop;

        return {
          className: getToggledClassName(isToggled),
        };
      },
    },
    {
      name: 'evaluate.mpr',
      evaluate: ({ viewportId, disabledText = 'Selected viewport is not reconstructable' }) => {
        const { protocol } = hangingProtocolService.getActiveProtocol();

        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        if (!displaySetUIDs?.length) {
          return;
        }

        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);

        const areReconstructable = displaySets.every(displaySet => {
          return displaySet.isReconstructable;
        });

        if (!areReconstructable) {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
            disabledText: disabledText ?? 'Not available on the current viewport',
          };
        }

        const isMpr = protocol?.id === 'mpr';

        return {
          disabled: false,
          className: getToggledClassName(isMpr),
        };
      },
    },
  ];
}

function getToolNameForButton(button) {
  const { props } = button;

  const commands = props?.commands || button.commands;
  const commandsArray = Array.isArray(commands) ? commands : [commands];
  const firstCommand = commandsArray[0];
  if (typeof firstCommand === 'string') {
    // likely not a cornerstone tool
    return null;
  }

  if ('commandOptions' in firstCommand) {
    return firstCommand.commandOptions.toolName ?? props?.id ?? button.id;
  }

  // use id as a fallback for toolName
  return props?.id ?? button.id;
}
