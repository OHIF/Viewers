import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { VolumeRenderingQualityProps } from '../../types/ViewportPresets';
import { Numeric } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export function VolumeRenderingQuality({
  volumeRenderingQualityRange,
  viewportId,
}: VolumeRenderingQualityProps): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const { min, max, step } = volumeRenderingQualityRange;
  const [quality, setQuality] = useState(null);

  const onChange = useCallback(
    (value: number) => {
      commandsManager.runCommand('setVolumeRenderingQulaity', {
        viewportId,
        volumeQuality: value,
      });
      setQuality(value);
    },
    [commandsManager, viewportId]
  );

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { actor } = viewport.getActors()[0];
    const mapper = actor.getMapper();
    const image = mapper.getInputData();
    const spacing = image.getSpacing();
    const sampleDistance = mapper.getSampleDistance();
    const averageSpacing = spacing.reduce((a, b) => a + b) / 3.0;
    if (sampleDistance === averageSpacing) {
      setQuality(1);
    } else {
      setQuality(Math.sqrt(averageSpacing / (sampleDistance * 0.5)));
    }
  }, [cornerstoneViewportService, viewportId]);

  return (
    <div className="my-1 mt-2 flex flex-col space-y-2">
      {quality !== null && (
        <div className="w-full pl-2 pr-1">
          <Numeric.Container
            mode="singleRange"
            min={min}
            max={max}
            step={step}
            value={quality}
            onChange={onChange}
          >
            <div className="flex flex-row items-center">
              <Numeric.Label className="w-16">Quality</Numeric.Label>
              <Numeric.SingleRange sliderClassName="mx-2 flex-grow" />
            </div>
          </Numeric.Container>
        </div>
      )}
    </div>
  );
}
