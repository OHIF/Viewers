import React, { useEffect, useState } from 'react';
import classnames from 'classnames';

export default function Toolbar({ servicesManager }) {
  const { toolbarService } = servicesManager.services;
  const [toolbarButtons, setToolbarButtons] = useState([]);
  const [buttonState, setButtonState] = useState({
    primaryToolId: '',
    toggles: {},
    groups: {},
  });

  // Could track buttons and state separately...?
  useEffect(() => {
    const { unsubscribe: unsub1 } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_MODIFIED,
      () => setToolbarButtons(toolbarService.getButtonSection('primary'))
    );
    const { unsubscribe: unsub2 } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => setButtonState({ ...toolbarService.state })
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [toolbarService]);

  return (
    <>
      {toolbarButtons.map((toolDef, index) => {
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
