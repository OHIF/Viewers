import React, { useEffect, useState } from 'react';
import { Types } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui';
import classnames from 'classnames';

export default function Toolbar({
  servicesManager,
}: Types.Extensions.ExtensionParams): React.ReactElement {
  const { toolbarService } = servicesManager.services;

  const [viewportGrid, viewportGridService] = useViewportGrid();

  const [toolbarButtons, setToolbarButtons] = useState([]);
  const [buttonState, setButtonState] = useState({
    primaryToolId: '',
    toggles: {},
    groups: {},
  });

  // Could track buttons and state separately...?
  useEffect(() => {
    const updateToolbar = () => {
      const toolGroupId = viewportGridService.getActiveViewportOption('toolGroupId', 'default');
      setToolbarButtons(toolbarService.getButtonSection(toolGroupId));
    };

    const { unsubscribe: unsub1 } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_MODIFIED,
      updateToolbar
    );
    const { unsubscribe: unsub2 } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => setButtonState({ ...toolbarService.state })
    );

    updateToolbar();

    return () => {
      unsub1();
      unsub2();
    };
  }, [toolbarService, viewportGrid]);

  return (
    <>
      {toolbarButtons.map(toolDef => {
        const { id, Component, componentProps } = toolDef;
        // TODO: ...

        // isActive if:
        // - id is primary?
        // - id is in list of "toggled on"?
        let isActive;
        if (componentProps.type === 'toggle') {
          isActive = buttonState.toggles[id];
        }
        // Also need... to filter list for splitButton, and set primary based on most recently clicked
        // Also need to kill the radioGroup button's magic logic
        // Everything should be reactive off these props, so commands can inform ToolbarService

        // These can... Trigger toolbar events based on updates?
        // Then sync using useEffect, or simply modify the state here?
        return (
          // The margin for separating the tools on the toolbar should go here and NOT in each individual component (button) item.
          // This allows for the individual items to be included in other UI components where perhaps alternative margins are desired.
          <div key={id} className={classnames('mr-1')}>
            <Component
              id={id}
              {...componentProps}
              bState={buttonState}
              isActive={isActive}
              onInteraction={args => toolbarService.recordInteraction(args)}
              servicesManager={servicesManager}
            />
          </div>
        );
      })}
    </>
  );
}
