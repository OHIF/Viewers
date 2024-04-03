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
  const { customizationService } = servicesManager.services;

  const { presets } = customizationService.get('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.get('cornerstone.colorbar');
  const { volumeRenderingPresets, volumeRenderingQualityRange } = customizationService.get(
    'cornerstone.3dVolumeRendering'
  );

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
      presets={displaySetPresets[0]}
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
      commandsManager={commandsManager}
      serviceManager={servicesManager}
      colorbarProperties={colorbarProperties}
      displaySets={displaySets}
      volumeRenderingPresets={volumeRenderingPresets}
      volumeRenderingQualityRange={volumeRenderingQualityRange}
    />
  ) : null;
}
