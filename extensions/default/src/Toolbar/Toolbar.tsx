import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import type { Types } from '@ohif/core';
import { Tooltip } from '@ohif/ui';

export default function Toolbar({
  servicesManager,
}: Types.Extensions.ExtensionParams): React.ReactElement {
  const {
    toolbarService,
    viewportGridService,
    cornerstoneViewportService,
    toolGroupService,
    displaySetService,
  } = servicesManager.services;

  const [toolbarButtons, setToolbarButtons] = useState([]);
  const { ButtonTypes } = toolbarService.constructor;

  const handleWithCondition = ({ componentProps, button, viewportId, toolGroup }) => {
    const { condition } = componentProps;
    if (!condition) {
      return { ...button, disabled: false };
    }

    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    if (!displaySetUIDs) {
      return { ...button, disabled: true };
    }

    const displaySets = displaySetUIDs.map(displaySetUID =>
      displaySetService.getDisplaySetByUID(displaySetUID)
    );

    if (displaySets && condition({ displaySets, toolGroup })) {
      return { ...button, disabled: false };
    } else {
      return { ...button, disabled: true };
    }
  };

  /**
   * Updates the toolbar buttons based on the active viewport.
   *
   * @param viewportId - The ID of the active viewport.
   * @returns The updated toolbar buttons.
   */
  const updateToolbarButtons = useCallback(
    (viewportId: string) => {
      const toolbarButtons = toolbarService.getButtonSection('primary');
      const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

      if (!toolGroup) {
        return toolbarButtons;
      }

      return toolbarButtons.map(button => {
        const { componentProps } = button;

        if (componentProps.primary && componentProps.items.length > 0) {
          // Todo: handle nested items
          return { ...button, disabled: false };
        }

        if (!componentProps.type) {
          return { ...button, disabled: false };
        }

        if ([ButtonTypes.ACTION, ButtonTypes.TOGGLE].includes(componentProps.type)) {
          return handleWithCondition({ componentProps, button, viewportId, toolGroup });
        }

        // if we reach here it's a tool, so it has a command
        const toolName = componentProps.commands[0].commandOptions.toolName;
        const belongsToToolGroup = Object.keys(toolGroup.toolOptions).includes(toolName);

        return { ...button, disabled: !belongsToToolGroup };
      });
    },
    [toolbarService, toolGroupService, displaySetService]
  );

  /**
   * Callback function for handling toolbar interactions.
   * @param args - The arguments passed to the callback function.
   */
  const onInteraction = useCallback(
    (args: object) => toolbarService.recordInteraction(args),
    [toolbarService]
  );

  /**
   * Subscription callback for toolbar modification event.
   */
  useEffect(() => {
    const handleToolbarModified = () => {
      const { activeViewportId } = viewportGridService.getState();
      setToolbarButtons(updateToolbarButtons(activeViewportId));
    };

    const subscription1 = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_MODIFIED,
      handleToolbarModified
    );

    // to make sure the initial render/state is correct
    const subscription2 = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      handleToolbarModified
    );

    return () => {
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    };
  }, [toolbarService, viewportGridService, toolGroupService, updateToolbarButtons]);

  /**
   * Subscription callback for active viewport ID change event.
   *
   * @param {object} evtDetail - The event details.
   */
  useEffect(() => {
    const handleActiveViewportIdChanged = (evtDetail: object) => {
      setToolbarButtons(updateToolbarButtons(evtDetail.viewportId));
    };

    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      handleActiveViewportIdChanged
    );

    return () => subscription.unsubscribe();
  }, [viewportGridService, toolbarButtons, updateToolbarButtons]);

  return (
    <>
      {toolbarButtons.map(toolDef => {
        const { id, Component, componentProps, disabled } = toolDef;
        const tool = (
          <Component
            key={id}
            id={id}
            {...componentProps}
            onInteraction={onInteraction}
            servicesManager={servicesManager}
          />
        );

        return disabled ? (
          <Tooltip
            key={id}
            position="bottom"
            content={
              <>
                {componentProps.label}
                {disabled && (
                  <div className="text-xs text-white">
                    Tool not available for current Active viewport
                  </div>
                )}
              </>
            }
          >
            <div className={classnames('ohif-disabled mr-1')}>{tool}</div>
          </Tooltip>
        ) : (
          <div
            key={id}
            className="mr-1"
          >
            {tool}
          </div>
        );
      })}
    </>
  );
}
