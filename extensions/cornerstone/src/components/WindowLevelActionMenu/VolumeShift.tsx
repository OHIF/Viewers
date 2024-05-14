import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { VolumeShiftProps } from '../../types/ViewportPresets';

export function VolumeShift({
  viewportId,
  commandsManager,
  servicesManager,
}: VolumeShiftProps): ReactElement {
  const { cornerstoneViewportService } = servicesManager.services;
  const [minShift, setMinShift] = useState<number | null>(null);
  const [maxShift, setMaxShift] = useState<number | null>(null);
  const [shift, setShift] = useState<number | null>(
    cornerstoneViewportService.getCornerstoneViewport(viewportId)?.shiftedBy || 0
  );
  const [step, setStep] = useState<number | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const prevShiftRef = useRef<number>(shift);

  const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
  const { actor } = viewport.getActors()[0];
  const ofun = actor.getProperty().getScalarOpacity(0);

  useEffect(() => {
    if (isBlocking) {
      return;
    }
    const range = ofun.getRange();

    const transferFunctionWidth = range[1] - range[0];

    const minShift = -transferFunctionWidth;
    const maxShift = transferFunctionWidth;

    setMinShift(minShift);
    setMaxShift(maxShift);
    setStep(Math.pow(10, Math.floor(Math.log10(transferFunctionWidth / 500))));
  }, [cornerstoneViewportService, viewportId, actor, ofun, isBlocking]);

  const onChangeRange = useCallback(
    newShift => {
      const shiftDifference = newShift - prevShiftRef.current;
      prevShiftRef.current = newShift;
      viewport.shiftedBy = newShift;
      commandsManager.runCommand('shiftVolumeOpacityPoints', {
        viewportId,
        shift: shiftDifference,
      });
    },
    [commandsManager, viewportId, viewport]
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
            value={shift}
            onChange={e => {
              const shiftValue = parseInt(e.target.value, 10);
              setShift(shiftValue);
              onChangeRange(shiftValue);
            }}
            id="shift"
            onMouseDown={() => setIsBlocking(true)}
            onMouseUp={() => setIsBlocking(false)}
            max={maxShift}
            min={minShift}
            type="range"
            step={step}
            style={{
              background: calculateBackground((shift - minShift) / (maxShift - minShift)),
              '--thumb-inner-color': '#5acce6',
              '--thumb-outer-color': '#090c29',
            }}
          />
        )}
      </div>
    </>
  );
}
