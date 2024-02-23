import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import { type Types } from '@ohif/core';
import { Tooltip } from '@ohif/ui';
import { evaluateButtonCondition } from './evaluateToolbarButtonState';

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

  const { EVENTS } = toolbarService;
  const [toolbarButtons, setToolbarButtons] = useState([]);

  /**
   * Refreshes the toolbar buttons for the active viewport where
   * we should check if the tool is available for the current active viewport.
   *
   * For each button we check:
   * - Button Tools: we check if the tool name is part of the active viewport toolGroup
   * - Button Actions and Toggles: We check if there is a 'condition' function and if it returns true
   * - Nested Buttons: We run the same checks for each nested button
   */
  const refreshToolbarButtons = useCallback(
    viewportId => {
      const buttons = toolbarService.getButtonSection('primary');
      const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

      if (!toolGroup) {
        return buttons;
      }

      return buttons.map(button => {
        const { componentProps } = button;
        return !componentProps.type && !componentProps.items
          ? button
          : evaluateButtonCondition({
              button,
              viewportId,
              toolGroup,
              services: { viewportGridService, displaySetService },
            });
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
      setToolbarButtons(refreshToolbarButtons(activeViewportId));
    };

    const subs = [EVENTS.TOOL_BAR_MODIFIED, EVENTS.TOOL_BAR_STATE_MODIFIED].map(event => {
      return toolbarService.subscribe(event, handleToolbarModified);
    });

    // to make sure the initial render/state is correct
    const subscription2 = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      handleToolbarModified
    );

    return () => {
      subs.forEach(sub => sub.unsubscribe());
      subscription2.unsubscribe();
    };
  }, [toolbarService, viewportGridService, toolGroupService, refreshToolbarButtons]);

  /**
   * Subscription callback for active viewport ID change event.
   *
   * @param {object} evtDetail - The event details.
   */
  useEffect(() => {
    const handleActiveViewportIdChanged = (evtDetail: object) => {
      setToolbarButtons(refreshToolbarButtons(evtDetail.viewportId));
    };

    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      handleActiveViewportIdChanged
    );

    return () => subscription.unsubscribe();
  }, [viewportGridService, toolbarButtons, refreshToolbarButtons]);

  return (
    <>
      {toolbarButtons.map(toolDef => {
        const { id, Component, componentProps, disabled } = toolDef;
        const tool = (
          <Component
            key={id}
            id={id}
            onInteraction={onInteraction}
            servicesManager={servicesManager}
            {...componentProps}
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
