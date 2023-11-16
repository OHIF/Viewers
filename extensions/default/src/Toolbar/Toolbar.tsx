import React, { useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import { useViewportGrid } from '@ohif/ui';

export default function Toolbar({
  servicesManager,
}: Types.Extensions.ExtensionParams): React.ReactElement {
  const { toolbarService } = servicesManager.services;

  const [viewportGrid, viewportGridService] = useViewportGrid();

  const [toolbarButtons, setToolbarButtons] = useState([]);

  useEffect(() => {
    const updateToolbar = () => {
      const toolGroupId =
        viewportGridService.getActiveViewportOptionByKey('toolGroupId') ?? 'default';
      setToolbarButtons(toolbarService.getButtonSection(toolGroupId));
    };

    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_MODIFIED,
      updateToolbar
    );

    updateToolbar();

    return () => {
      unsubscribe();
    };
  }, [toolbarService, viewportGrid]);

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
