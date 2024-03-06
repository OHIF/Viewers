import React, { ReactElement, useCallback } from 'react';
import { AllInOneMenu } from '@ohif/ui';
import { CinematicRenderingProps } from '../../types/ViewportPresets';
export function CinematicRendering({
  viewportId,
  commandsManager,
  viewportQualityPresets,
}: CinematicRenderingProps): ReactElement {
  const onClick = useCallback(
    (value: number) => {
      commandsManager.runCommand('setVolumeQuality', {
        viewportId,
        volumeQuality: value,
      });
    },
    [commandsManager, viewportId]
  );

  return (
    <AllInOneMenu.ItemPanel>
      {viewportQualityPresets.map((preset, index) => (
        <AllInOneMenu.Item
          key={index}
          label={preset.label}
          onClick={() => onClick(preset.value)}
        />
      ))}
    </AllInOneMenu.ItemPanel>
  );
}
