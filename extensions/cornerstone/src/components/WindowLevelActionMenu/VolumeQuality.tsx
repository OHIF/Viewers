import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { VolumeQualityProps } from '../../types/ViewportPresets';

export function VolumeQuality({
  volumeQualityRange,
  commandsManager,
  serviceManager,
  viewportId,
}: VolumeQualityProps): ReactElement {
  const { cornerstoneViewportService } = serviceManager.services;
  const { min, max, step } = volumeQualityRange;
  const [quality, setQuality] = useState(null);

  const onChange = useCallback(
    (value: number) => {
      commandsManager.runCommand('setVolumeQuality', {
        viewportId,
        volumeQuality: value,
      });
      setQuality(value);
    },
    [commandsManager, viewportId]
  );

  const calculateBackground = value => {
    const percentage = ((value - 0) / (1 - 0)) * 100;
    return `linear-gradient(to right, #5acce6 0%, #5acce6 ${percentage}%, #3a3f99 ${percentage}%, #3a3f99 100%)`;
  };

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
    <>
      <div className="all-in-one-menu-item flex  w-full flex-row !items-center justify-between gap-[10px]">
        <label
          className="block text-white"
          htmlFor="volume"
        >
          Quality
        </label>
        {quality !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            value={quality}
            id="volume"
            max={max}
            min={min}
            type="range"
            step={step}
            onChange={e => onChange(parseInt(e.target.value, 10))}
            style={{ background: calculateBackground((quality - min) / (max - min)) }}
          />
        )}
      </div>
    </>
  );
}
