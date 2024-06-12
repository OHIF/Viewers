import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { SwitchButton } from '@ohif/ui';
import { VolumeShadeProps } from '../../types/ViewportPresets';

export function VolumeShade({
  commandsManager,
  viewportId,
  servicesManager,
}: VolumeShadeProps): ReactElement {
  const { cornerstoneViewportService } = servicesManager.services;
  const [shade, setShade] = useState(true);
  const [key, setKey] = useState(0);

  const onShadeChange = useCallback(
    (checked: boolean) => {
      commandsManager.runCommand('setVolumeLighting', { viewportId, options: { shade: checked } });
    },
    [commandsManager, viewportId]
  );
  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { actor } = viewport.getActors()[0];
    const shade = actor.getProperty().getShade();
    setShade(shade);
    setKey(key + 1);
  }, [viewportId, cornerstoneViewportService]);

  return (
    <SwitchButton
      key={key}
      label="Shade"
      checked={shade}
      onChange={() => {
        setShade(!shade);
        onShadeChange(!shade);
      }}
    />
  );
}
