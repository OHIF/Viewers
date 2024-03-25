import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { VolumeShiftProps } from '../../types/ViewportPresets';

export function VolumeShift({
  viewportId,
  commandsManager,
  serviceManager,
}: VolumeShiftProps): ReactElement {
  const { cornerstoneViewportService } = serviceManager.services;
  const [minShift, setMinShift] = useState<number | null>(null);
  const [maxShift, setMaxShift] = useState<number | null>(null);
  const [shift, setShift] = useState<number | null>(null);
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { actor } = viewport.getActors()[0];
    setMinShift(-100);
    setMaxShift(100);
    setShift(1);
    setStep(1);
  }, [cornerstoneViewportService, viewportId]);

  const onChangeRange = useCallback(
    shift => {
      commandsManager.runCommand('shiftVolumeOpacityPoints', {
        viewportId,
        shift,
      });
    },
    [commandsManager, viewportId]
  );

  const calculateBackground = value => {
    const percentage = ((value - 0) / (1 - 0)) * 100;
    return `linear-gradient(to right, #5acce6 0%, #5acce6 ${percentage}%, #3a3f99 ${percentage}%, #3a3f99 100%)`;
  };

  return (
    <>
      <div className="all-in-one-menu-item flex  w-full flex-row !items-center justify-between gap-[10px]">
        <label
          className="block  text-white"
          htmlFor="shift"
        >
          Shift
        </label>
        {step !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            // add value here
            value={shift}
            onChange={e => {
              const shiftValue = parseInt(e.target.value, 10);
              setShift(shiftValue);
              onChangeRange(shiftValue);
            }}
            id="shift"
            // add value here
            max={maxShift}
            // add value here
            min={minShift}
            type="range"
            // add value here
            step={step}
            style={{
              // add value here
              background: calculateBackground((shift - minShift) / (maxShift - minShift)),
            }}
          />
        )}
      </div>
    </>
  );
}
