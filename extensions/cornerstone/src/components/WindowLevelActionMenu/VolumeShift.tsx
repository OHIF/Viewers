import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { VolumeShiftProps } from '../../types/ViewportPresets';
import { Numeric } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export function VolumeShift({ viewportId }: VolumeShiftProps): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
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
      setShift(newShift);
    },
    [commandsManager, viewportId, viewport]
  );

  return (
    <div className="my-1 mt-2 flex flex-col space-y-2">
      {step !== null && minShift !== null && maxShift !== null && (
        <div className="w-full pl-2 pr-1">
          <Numeric.Container
            mode="singleRange"
            min={minShift}
            max={maxShift}
            step={step}
            value={shift}
            onChange={onChangeRange}
            onMouseDown={() => setIsBlocking(true)}
            onMouseUp={() => setIsBlocking(false)}
          >
            <div className="flex flex-row items-center">
              <Numeric.Label className="w-16">Shift</Numeric.Label>
              <Numeric.SingleRange sliderClassName="mx-2 flex-grow" />
            </div>
          </Numeric.Container>
        </div>
      )}
    </div>
  );
}
