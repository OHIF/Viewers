import React, { ReactElement } from 'react';
import { AllInOneMenu } from '@ohif/ui';
import { VolumeRenderingOptionsProps } from '../../types/ViewportPresets';
import { VolumeQuality } from './VolumeQuality';
import { VolumeMappingRange } from './VolumeMappingRange';
import { VolumeLighting } from './VolumeLighting';
import { VolumeShade } from './VolumeShade';
export function VolumeRenderingOptions({
  viewportId,
  commandsManager,
  volumeQualityRange,
  serviceManager,
}: VolumeRenderingOptionsProps): ReactElement {
  return (
    <AllInOneMenu.ItemPanel>
      <div className="all-in-one-menu-item flex w-full justify-center">
        <VolumeShade />
      </div>
      <div className="all-in-one-menu-item flex !h-20 w-full flex-col !items-start justify-center">
        <VolumeQuality
          viewportId={viewportId}
          commandsManager={commandsManager}
          volumeQualityRange={volumeQualityRange}
        />
      </div>
      <div className="all-in-one-menu-item  flex !h-28 w-full flex-col !items-start justify-center">
        <VolumeMappingRange
          viewportId={viewportId}
          commandsManager={commandsManager}
          serviceManager={serviceManager}
        />
      </div>
      <div className="all-in-one-menu-item flex !h-32 w-full flex-col !items-start justify-center">
        <VolumeLighting />
      </div>
    </AllInOneMenu.ItemPanel>
  );
}
