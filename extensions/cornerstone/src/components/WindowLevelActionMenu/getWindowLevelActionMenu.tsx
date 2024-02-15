import React, { ReactNode } from 'react';
import { WindowLevelActionMenu } from './WindowLevelActionMenu';

export function getWindowLevelActionMenu({
  viewportId,
  element,
  displaySets,
  servicesManager,
  commandsManager,
  verticalDirection,
  horizontalDirection,
}): ReactNode {
  const { customizationService, colorbarService, cornerstoneViewportService } =
    servicesManager.services;

  const { presets } = customizationService.get('cornerstone.windowLevelPresets');
  const {
    width,
    colorbarTickPosition,
    colorbarContainerPosition,
    colormaps,
    colorbarInitialColormap,
  } = customizationService.get('cornerstone.colorbar');

  const displaySetPresets = displaySets
    .filter(displaySet => presets[displaySet.Modality])
    .map(displaySet => {
      return { [displaySet.Modality]: presets[displaySet.Modality] };
    });

  const hasMenu = displaySetPresets.length > 0;

  return hasMenu ? (
    <WindowLevelActionMenu
      viewportId={viewportId}
      element={element}
      colormaps={colormaps}
      presets={displaySetPresets[0]}
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
      commandsManager={commandsManager}
      colorbarService={colorbarService}
      colorbarWidth={width}
      colorbarContainerPosition={colorbarContainerPosition}
      colorbarTickPosition={colorbarTickPosition}
      colorbarInitialColormap={colorbarInitialColormap}
      cornerstoneViewportService={cornerstoneViewportService}
    />
  ) : null;
}
