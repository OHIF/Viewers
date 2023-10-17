import React, { useEffect, useState, useCallback } from 'react';
import classnames from 'classnames';

export default function Toolbar({ servicesManager }) {
  const { toolbarService } = servicesManager.services;
  const [toolbarButtons, setToolbarButtons] = useState([]);

  useEffect(() => {
    const { unsubscribe } = toolbarService.subscribe(toolbarService.EVENTS.TOOL_BAR_MODIFIED, () =>
      setToolbarButtons(toolbarService.getButtonSection('primary'))
    );

    return () => {
      unsubscribe();
    };
  }, [toolbarService]);

  const onInteraction = useCallback(
    args => toolbarService.recordInteraction(args),
    [toolbarService]
  );

  return (
    <>
      {toolbarButtons.map(toolDef => {
        const { id, Component, componentProps } = toolDef;
        return (
          // The margin for separating the tools on the toolbar should go here and NOT in each individual component (button) item.
          // This allows for the individual items to be included in other UI components where perhaps alternative margins are desired.
          <div
            key={id}
            className={classnames('mr-1')}
          >
            <Component
              id={id}
              {...componentProps}
              onInteraction={onInteraction}
              servicesManager={servicesManager}
            />
          </div>
        );
      })}
    </>
  );
}
