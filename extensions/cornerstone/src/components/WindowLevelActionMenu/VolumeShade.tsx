import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { Switch } from '@ohif/ui-next';
import { VolumeShadeProps } from '../../types/ViewportPresets';

export function VolumeShade({
  commandsManager,
  viewportId,
  servicesManager,
  onClickShade = bool => {},
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
    onClickShade(shade);
    setKey(key + 1);
  }, [viewportId, cornerstoneViewportService]);

  return (
    <div className="flex items-center gap-2">
      <span>Shade</span>
      <Switch
        key={key}
        checked={shade}
        onCheckedChange={() => {
          setShade(!shade);
          onClickShade(!shade);
          onShadeChange(!shade);
        }}
      />
    </div>
  );
}