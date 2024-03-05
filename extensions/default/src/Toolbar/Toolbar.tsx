import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import { type Types } from '@ohif/core';
import { Tooltip } from '@ohif/ui';

export default function Toolbar({
  servicesManager,
}: Types.Extensions.ExtensionParams): React.ReactElement {
  const { toolbarService, viewportGridService, cornerstoneViewportService } =
    servicesManager.services;

  const { EVENTS } = toolbarService;
  const [toolbarButtons, setToolbarButtons] = useState([]);

  /**
   * Callback function for handling toolbar interactions.
   * @param args - The arguments passed to the callback function.
   */
  const onInteraction = useCallback(
    (args: object) => {
      const viewportId = viewportGridService.getActiveViewportId();
      const refreshProps = {
        viewportId,
      };

      toolbarService.recordInteraction(args, {
        refreshProps,
      });
    },
    [toolbarService, viewportGridService]
  );

  /**
   * Subscription callback for toolbar modification event.
   */
  useEffect(() => {
    const handleToolbarModified = () => {
      setToolbarButtons(toolbarService.getButtonSection('primary'));
    };

    const subs = [EVENTS.TOOL_BAR_MODIFIED, EVENTS.TOOL_BAR_STATE_MODIFIED].map(event => {
      return toolbarService.subscribe(event, handleToolbarModified);
    });

    return () => {
      subs.forEach(sub => sub.unsubscribe());
    };
  }, [toolbarService]);

  /**
   * Subscription callback for active viewportId change event.
   *
   * @param {object} evtDetail - The event details.
   */
  useEffect(() => {
    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      ({ viewportId }) => {
        toolbarService.refreshToolbarState({ viewportId });
      }
    );

    return () => subscription.unsubscribe();
  }, [viewportGridService, toolbarService]);

  /**
   * Subscription callback for when viewport data changes
   * @param {object} evtDetail - The event details.
   */
  useEffect(() => {
    // Todo: this is not the right place for this
    const subscription = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      ({ viewportId }) => {
        toolbarService.refreshToolbarState({ viewportId });
      }
    );

    return () => subscription.unsubscribe();
  }, [cornerstoneViewportService, toolbarService, viewportGridService]);

  if (!toolbarButtons.length) {
    return null;
  }

  return (
    <>
      {toolbarButtons.map(toolDef => {
        if (!toolDef) {
          return null;
        }

        const { id, Component, componentProps } = toolDef;
        const { disabled } = componentProps;

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
                <div className="text-xs text-white">
                  Tool not available for current Active viewport
                </div>
              </>
            }
          >
            <div className={classnames('mr-1')}>{tool}</div>
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
