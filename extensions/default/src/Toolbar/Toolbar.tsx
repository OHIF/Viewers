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

  const handleWithCondition = ({ props, viewportId, toolGroup }) => {
    const { condition } = props;

    if (!condition) {
      return true;
    }

    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    if (!displaySetUIDs) {
      return true;
    }

    const displaySets = displaySetUIDs.map(displaySetUID =>
      displaySetService.getDisplaySetByUID(displaySetUID)
    );

    if (displaySets && condition({ displaySets, toolGroup })) {
      return true;
    } else {
      return false;
    }
  };

  const handleInsideToolGroup = ({ props, toolGroup, button = null }) => {
    const { commands } = props;
    const toolName = commands[0].commandOptions.toolName;
    const belongsToToolGroup = Object.keys(toolGroup.toolOptions).includes(toolName);

    if (belongsToToolGroup && button) {
      return button;
    } else if (!belongsToToolGroup && button) {
      return { ...button, disabled: true };
    } else if (belongsToToolGroup && !button) {
      return props;
    } else {
      return { ...props, disabled: true };
    }
  };

  const handleSingle = ({ button = null, props, viewportId, toolGroup }) => {
    if ([ButtonTypes.ACTION, ButtonTypes.TOGGLE].includes(props.type)) {
      const cond = handleWithCondition({ props, viewportId, toolGroup });
      if (cond && button) {
        return button;
      } else if (!cond && button) {
        return { ...button, disabled: true };
      } else if (cond && !button) {
        return props;
      } else {
        return { ...props, disabled: true };
      }
    }

    // if we reach here it's a tool, so it has a command
    return handleInsideToolGroup({ props, toolGroup, button });
  };

  const handleNestedButtons = ({ button, viewportId, toolGroup }) => {
    const {
      componentProps: { items, primary, secondary },
    } = button;

    const newPrimary = handleSingle({ props: primary, viewportId, toolGroup });
    const newSecondary = handleSingle({ props: secondary, viewportId, toolGroup });

    const updatedItems = items.map(item => {
      return handleSingle({ props: item, viewportId, toolGroup });
    });

    return {
      ...button,
      componentProps: {
        ...button.componentProps,
        primary: newPrimary,
        secondary: newSecondary,
        items: updatedItems,
      },
    };
  };

  const handle = ({ button, viewportId, toolGroup }) => {
    const { componentProps: props } = button;
    debugger;
    if (!props.type) {
      return button;
    }

    if (props.primary && props.items.length > 0) {
      return handleNestedButtons({ button, viewportId, toolGroup });
    }

    return handleSingle({ button, props, viewportId, toolGroup });
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

      const up = toolbarButtons.map(button => {
        const { componentProps } = button;

        if (!componentProps.type && !componentProps.items) {
          return { ...button, disabled: false };
        }

        return handle({ button, viewportId, toolGroup });
      });

      return up;
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
        console.debug('🚀 ~ id:', id);
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
