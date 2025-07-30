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
      args.event?.stopPropagation?.();
      const viewportId = viewportGridService.getActiveViewportId();
      const refreshProps = { viewportId };

      const buttonProps = toolbarService.getButtonProps(args.itemId);

      if (buttonProps.commands || buttonProps.options) {
        const allCommands = [];
        const options = buttonProps.options || [];
        const itemCommands = buttonProps.commands || [];

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
              const commandOptions = {
                ...option,
                value: valueToUse,
                options: buttonProps.options,
                servicesManager: servicesManager,
                commandsManager: commandsManager,
              };

              const processedCommand = () => commandsManager.run(command, commandOptions);
              allCommands.push(processedCommand);
            });
          });
        }

        buttonProps.commands = allCommands;
      }
      toolbarService.recordInteraction({ ...args, ...buttonProps }, { refreshProps });
    },
    [toolbarService, viewportGridService, toolbarButtons]
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
