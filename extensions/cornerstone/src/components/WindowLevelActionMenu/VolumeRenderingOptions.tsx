import React, { ReactElement } from 'react';
import { AllInOneMenu } from '@ohif/ui';
import { VolumeRenderingOptionsProps } from '../../types/ViewportPresets';
import { VolumeRenderingQuality } from './VolumeRenderingQuality';
import { VolumeShift } from './VolumeShift';
import { VolumeLighting } from './VolumeLighting';
import { VolumeShade } from './VolumeShade';
export function VolumeRenderingOptions({
  viewportId,
  commandsManager,
  volumeRenderingQualityRange,
  serviceManager,
}: VolumeRenderingOptionsProps): ReactElement {
  return (
    <AllInOneMenu.ItemPanel>
      <VolumeRenderingQuality
        viewportId={viewportId}
        commandsManager={commandsManager}
        serviceManager={serviceManager}
        volumeRenderingQualityRange={volumeRenderingQualityRange}
      />

      <VolumeShift
        viewportId={viewportId}
        commandsManager={commandsManager}
        serviceManager={serviceManager}
      />
      <div className="all-in-one-menu-item flex w-full justify-start">
        <div className="text-aqua-pale text-[13px]">LIGHTING</div>
      </div>
      <AllInOneMenu.DividerItem />
      <div className="all-in-one-menu-item flex w-full justify-center">
        <VolumeShade
          commandsManager={commandsManager}
          serviceManager={serviceManager}
          viewportId={viewportId}
        />
      </div>
      <VolumeLighting
        viewportId={viewportId}
        commandsManager={commandsManager}
        serviceManager={serviceManager}
      />
    </AllInOneMenu.ItemPanel>
  );
}
