import React, { ReactNode } from 'react';
import { WindowLevelActionMenu } from './WindowLevelActionMenu';

export function getWindowLevelActionMenu({
  viewportId,
  viewportElem,
  displaySets,
  servicesManager,
  commandsManager,
  verticalDirection,
  horizontalDirection,
}): ReactNode {
  const { customizationService } = servicesManager.services;

  const { presets } = customizationService.get('cornerstone.windowLevelPresets');

  function onSetWindowLevel(props) {
    commandsManager.run({
      commandName: 'setViewportWindowLevel',
      commandOptions: {
        ...props,
      },
      context: 'CORNERSTONE',
    });
  }

  const displaySetPresets = displaySets
    .filter(displaySet => presets[displaySet.Modality])
    .map(displaySet => {
      return { [displaySet.Modality]: presets[displaySet.Modality] };
    });

  const hasMenu = displaySetPresets.length > 0;

  return hasMenu ? (
    <WindowLevelActionMenu
      viewportId={viewportId}
      viewportElem={viewportElem}
      presets={displaySetPresets[0]}
      onSetWindowLevel={onSetWindowLevel}
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
    />
  ) : null;
}
