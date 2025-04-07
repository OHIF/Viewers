import React, { ReactElement, useState } from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { VolumeRenderingOptionsProps } from '../../types/ViewportPresets';
import { VolumeRenderingQuality } from './VolumeRenderingQuality';
import { VolumeShift } from './VolumeShift';
import { VolumeLighting } from './VolumeLighting';
import { VolumeShade } from './VolumeShade';
export function VolumeRenderingOptions({
  viewportId,
  commandsManager,
  volumeRenderingQualityRange,
  servicesManager,
}: VolumeRenderingOptionsProps): ReactElement {
  const [hasShade, setShade] = useState(false);
  return (
    <AllInOneMenu.ItemPanel>
      <VolumeRenderingQuality
        viewportId={viewportId}
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        volumeRenderingQualityRange={volumeRenderingQualityRange}
      />

      <VolumeShift
        viewportId={viewportId}
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      />
      <div className="mt-2 flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-start px-2 text-base">
        <div className="text-muted-foreground text-sm">Lighting</div>
      </div>
      <div className="bg-background mt-1 mb-1 h-px w-full"></div>
      <div className="hover:bg-accent flex h-8 w-full flex-shrink-0 items-center px-2 text-base hover:rounded">
        <VolumeShade
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          viewportId={viewportId}
          onClickShade={setShade}
        />
      </div>
      <VolumeLighting
        viewportId={viewportId}
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        hasShade={hasShade}
      />
    </AllInOneMenu.ItemPanel>
  );
}
