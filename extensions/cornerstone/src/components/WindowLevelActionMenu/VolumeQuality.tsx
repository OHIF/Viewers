import React, { ReactElement, useCallback } from 'react';
import { VolumeQualityProps } from '../../types/ViewportPresets';

export function VolumeQuality({
  volumeQualityRange,
  commandsManager,
  viewportId,
}: VolumeQualityProps): ReactElement {
  const { min, max, step } = volumeQualityRange;
  const onChange = useCallback(
    (value: number) => {
      commandsManager.runCommand('setVolumeQuality', {
        viewportId,
        volumeQuality: value,
      });
    },
    [commandsManager, viewportId]
  );
  return (
    <>
      <div className="pb-1 text-[14px]"> Quality</div>
      <label
        className="text-aqua-pale block  text-sm font-medium"
        htmlFor="volume"
      >
        Rendering Quality
      </label>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 dark:bg-gray-700"
        defaultValue={2}
        id="volume"
        max={max}
        min={min}
        type="range"
        step={step}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      />
    </>
  );
}
