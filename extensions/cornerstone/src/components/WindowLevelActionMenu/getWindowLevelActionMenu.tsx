import React, { ReactNode } from 'react';
import { nonWLModalities, WindowLevelActionMenuProps } from './WindowLevelActionMenu';
import { useSystem } from '@ohif/core';

function WindowLevelActionMenu({
  viewportId,
  element,
  displaySets,
  verticalDirection,
  horizontalDirection,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  displaySets: AppTypes.DisplaySet[];
}>): ReactNode {
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  const presets = customizationService.getCustomization('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.getCustomization('cornerstone.colorbar');
  const { volumeRenderingPresets, volumeRenderingQualityRange } =
    customizationService.getCustomization('cornerstone.3dVolumeRendering');
  const WindowLevelActionMenu = customizationService.getCustomization(
    'viewportActionMenu.windowLevelActionMenu'
  );
  const displaySetPresets = displaySets
    .filter(displaySet => presets[displaySet.Modality])
    .map(displaySet => {
      return { [displaySet.Modality]: presets[displaySet.Modality] };
    });

  const modalities = displaySets
    .map(displaySet => displaySet.Modality)
    .filter(modality => !nonWLModalities.includes(modality));

  if (modalities.length === 0) {
    return null;
  }

  const WindowLevelActionMenuComponent = WindowLevelActionMenu?.component;

  return (
    <WindowLevelActionMenuComponent
      viewportId={viewportId}
      element={element}
      presets={displaySetPresets}
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
      colorbarProperties={colorbarProperties}
      displaySets={displaySets}
      volumeRenderingPresets={volumeRenderingPresets}
      volumeRenderingQualityRange={volumeRenderingQualityRange}
    />
  );
}

export function getWindowLevelActionMenu(props: WindowLevelActionMenuProps) {
  return <WindowLevelActionMenu {...props} />;
}
