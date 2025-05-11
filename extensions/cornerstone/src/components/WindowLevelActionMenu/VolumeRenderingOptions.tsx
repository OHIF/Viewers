import React, { ReactElement, useState } from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { VolumeRenderingQuality } from './VolumeRenderingQuality';
import { VolumeShift } from './VolumeShift';
import { VolumeLighting } from './VolumeLighting';
import { VolumeShade } from './VolumeShade';
import { useViewportRendering } from '../../hooks/useViewportRendering';

export function VolumeRenderingOptions({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { volumeRenderingQualityRange } = useViewportRendering(viewportId);
  const [hasShade, setShade] = useState(false);
  return (
    <AllInOneMenu.ItemPanel>
      <VolumeRenderingQuality
        viewportId={viewportId}
        volumeRenderingQualityRange={volumeRenderingQualityRange}
      />
      <VolumeShift viewportId={viewportId} />
      <div className="mt-2 flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-start px-2 text-base">
        <div className="text-muted-foreground text-sm">Lighting</div>
      </div>
      <div className="bg-background mt-1 mb-1 h-px w-full"></div>
      <div className="hover:bg-accent flex h-8 w-full flex-shrink-0 items-center px-2 text-base hover:rounded">
        <VolumeShade
          viewportId={viewportId}
          onClickShade={setShade}
        />
      </div>
      <VolumeLighting
        viewportId={viewportId}
        hasShade={hasShade}
      />
    </AllInOneMenu.ItemPanel>
  );
}
