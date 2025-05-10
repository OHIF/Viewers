import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSystem } from '../contextProviders/SystemProvider';
import { ToolbarHookReturn } from './types';

export function useToolbar({ buttonSection = 'primary' }: withAppTypes): ToolbarHookReturn {
  const { commandsManager, servicesManager } = useSystem();
  const { toolbarService, viewportGridService } = servicesManager.services;
  const { EVENTS } = toolbarService;

  // Store all buttons returned by the toolbar service
  const [toolbarButtons, setToolbarButtons] = useState(
    toolbarService.getButtonSection(buttonSection as string).filter(Boolean)
  );

  // Store state of open/closed menu items
  // Note: We keep this in local state to avoid re-evaluating the toolbar on every interaction
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});

  // Callback function for handling toolbar interactions
  const onInteraction = useCallback(
    args => {
      args.event?.stopPropagation?.();
      const viewportId = args.viewportId || viewportGridService.getActiveViewportId();
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
    [toolbarService, viewportGridService]
  );

  // Effect to handle toolbar modification events
  useEffect(() => {
    const handleToolbarModified = () => {
      const buttons = toolbarService.getButtonSection(buttonSection as string)?.filter(Boolean);
      setToolbarButtons(buttons);
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

  // Action API for toolbar buttons
  const actions = useMemo(() => {
    return {
      // Lock/Unlock actions
      lockItem: (itemId: string, viewportId?: string) => {
        const targetViewportId = viewportId || viewportGridService.getActiveViewportId();
        const button = toolbarService.getButton(itemId);

        if (button) {
          // Set isLocked flag in button metadata
          button.props = {
            ...button.props,
            isLocked: true,
          };

          // Re-evaluate the button
          toolbarService.refreshToolbarState({ viewportId: targetViewportId, itemId });
        }
      },

      unlockItem: (itemId: string, viewportId?: string) => {
        const targetViewportId = viewportId || viewportGridService.getActiveViewportId();
        const button = toolbarService.getButton(itemId);

        if (button) {
          // Set isLocked flag in button metadata
          button.props = {
            ...button.props,
            isLocked: false,
          };

          // Re-evaluate the button
          toolbarService.refreshToolbarState({ viewportId: targetViewportId, itemId });
        }
      },

      toggleLock: (itemId: string, viewportId?: string) => {
        const targetViewportId = viewportId || viewportGridService.getActiveViewportId();
        const button = toolbarService.getButton(itemId);

        if (button) {
          // Toggle isLocked flag in button metadata
          button.props = {
            ...button.props,
            isLocked: !button.props.isLocked,
          };

          // Re-evaluate the button
          toolbarService.refreshToolbarState({ viewportId: targetViewportId, itemId });
        }
      },

      isItemLocked: (itemId: string, viewportId?: string): boolean => {
        const button = toolbarService.getButton(itemId);
        return button?.props?.isLocked === true;
      },

      // Visibility actions - controlled by evaluator functions in toolbar items
      showItem: (itemId: string, viewportId?: string) => {
        const targetViewportId = viewportId || viewportGridService.getActiveViewportId();
        const button = toolbarService.getButton(itemId);

        if (button) {
          // Set isVisible flag in button metadata
          button.props = {
            ...button.props,
            isVisible: true,
          };

          // Re-evaluate the button
          toolbarService.refreshToolbarState({ viewportId: targetViewportId, itemId });
        }
      },

      hideItem: (itemId: string, viewportId?: string) => {
        const targetViewportId = viewportId || viewportGridService.getActiveViewportId();
        const button = toolbarService.getButton(itemId);

        if (button) {
          // Set isVisible flag in button metadata
          button.props = {
            ...button.props,
            isVisible: false,
          };

          // Re-evaluate the button
          toolbarService.refreshToolbarState({ viewportId: targetViewportId, itemId });
        }
      },

      toggleVisibility: (itemId: string, viewportId?: string) => {
        const targetViewportId = viewportId || viewportGridService.getActiveViewportId();
        const button = toolbarService.getButton(itemId);

        if (button) {
          // Toggle isVisible flag in button metadata
          button.props = {
            ...button.props,
            isVisible: button.props.isVisible === false ? true : false,
          };

          // Re-evaluate the button
          toolbarService.refreshToolbarState({ viewportId: targetViewportId, itemId });
        }
      },

      isItemVisible: (itemId: string, viewportId?: string): boolean => {
        const button = toolbarService.getButton(itemId);
        // If isVisible is explicitly false, return false; otherwise return true
        return button?.props?.isVisible !== false;
      },

      // Open/Close actions - managed in local state for performance
      openItem: (itemId: string, viewportId?: string) => {
        setOpenItemIds(prev => {
          // Close all other items
          const updated = {};
          // Then set the current item to open
          updated[itemId] = true;
          return updated;
        });
      },

      closeItem: (itemId: string, viewportId?: string) => {
        setOpenItemIds(prev => ({
          ...prev,
          [itemId]: false,
        }));
      },

      closeAllItems: (viewportId?: string) => {
        setOpenItemIds({});
      },

      isItemOpen: (itemId: string, viewportId?: string): boolean => {
        return openItemIds[itemId] === true;
      },
    };
  }, [viewportGridService, toolbarService, openItemIds]);

  if (!toolbarButtons?.length) {
    return {
      toolbarButtons: [],
      onInteraction,
      ...actions,
    };
  }

  // filter out buttons that are disabled and have hideWhenDisabled set to true
  const filteredToolbarButtons = toolbarButtons.filter(button => {
    const props = button.componentProps;
    return props.visible !== false;
  });

  return {
    toolbarButtons: filteredToolbarButtons,
    onInteraction,
    ...actions,
  };
}
