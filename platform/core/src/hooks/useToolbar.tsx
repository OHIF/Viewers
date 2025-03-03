import { useCallback, useEffect, useState } from 'react';
import { useSystem } from '../contextProviders/SystemProvider';

export function useToolbar({ buttonSection = 'primary' }: withAppTypes) {
  const { commandsManager, servicesManager } = useSystem();
  const { toolbarService, viewportGridService } = servicesManager.services;
  const { EVENTS } = toolbarService;

  const [toolbarButtons, setToolbarButtons] = useState(
    toolbarService.getButtonSection(buttonSection as string)
  );

  // Callback function for handling toolbar interactions
  const onInteraction = useCallback(
    args => {
      const viewportId = viewportGridService.getActiveViewportId();
      const refreshProps = { viewportId };

      const buttonProps = toolbarService.getButtonProps(args.itemId);

      if (buttonProps.commands || buttonProps.item?.commands || buttonProps.options) {
        const allCommands = [];
        const item = buttonProps.item || {};
        const options = buttonProps.options || item.options || [];
        const itemCommands = buttonProps.commands || item.commands;

        // Process item commands
        if (itemCommands) {
          Array.isArray(itemCommands)
            ? allCommands.push(...itemCommands)
            : allCommands.push(itemCommands);
        }

        // Process commands from options
        if (options.length > 0) {
          options.forEach(option => {
            if (!option.commands) {
              return;
            }

            const valueToUse = option.value;
            const commands = Array.isArray(option.commands) ? option.commands : [option.commands];

            commands.forEach(command => {
              switch (typeof command) {
                case 'string':
                  commandsManager.run(command, { value: valueToUse });
                  break;
                case 'object':
                  commandsManager.run({
                    ...command,
                    commandOptions: {
                      ...command.commandOptions,
                      ...option,
                      value: valueToUse,
                    },
                  });
                  break;
                case 'function':
                  command({
                    value: valueToUse,
                    commandsManager,
                    servicesManager,
                  });
                  break;
              }
            });

            allCommands.push(option.commands);
          });
        }

        buttonProps.commands = allCommands;
      }

      toolbarService.recordInteraction(buttonProps, { refreshProps });
    },
    [toolbarService, viewportGridService, commandsManager, servicesManager, toolbarButtons]
  );

  // Effect to handle toolbar modification events
  useEffect(() => {
    const handleToolbarModified = () => {
      setToolbarButtons(toolbarService.getButtonSection(buttonSection as string)?.filter(Boolean));
    };

    const subs = [EVENTS.TOOL_BAR_MODIFIED, EVENTS.TOOL_BAR_STATE_MODIFIED].map(event => {
      return toolbarService.subscribe(event, handleToolbarModified);
    });

    return () => {
      subs.forEach(sub => sub.unsubscribe());
    };
  }, [toolbarService]);

  // Effect to handle active viewportId change event
  useEffect(() => {
    const events = [
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      viewportGridService.EVENTS.VIEWPORTS_READY,
      viewportGridService.EVENTS.LAYOUT_CHANGED,
    ];

    const subscriptions = events.map(event => {
      return viewportGridService.subscribe(event, ({ viewportId }) => {
        viewportId = viewportId || viewportGridService.getActiveViewportId();
        toolbarService.refreshToolbarState({ viewportId });
      });
    });

    return () => subscriptions.forEach(sub => sub.unsubscribe());
  }, [viewportGridService, toolbarService]);

  return { toolbarButtons, onInteraction };
}
