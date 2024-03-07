import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { VolumeMappingRangeProps } from '../../types/ViewportPresets';

export function VolumeMappingRange({
  viewportId,
  commandsManager,
  serviceManager,
}: VolumeMappingRangeProps): ReactElement {
  const { cornerstoneViewportService } = serviceManager.services;
  const [imageDataRange, setImageDataRange] = useState(null);
  const [fullMappingRangeWidth, setFullMappingRangeWidth] = useState(null);
  const [rangeWidth, setRangeWidth] = useState(null);
  const [rangeShift, setRangeShift] = useState(null);
  const [minShift, setMinShift] = useState(null);
  const [maxShift, setMaxShift] = useState(null);
  const [maxWidth, setMaxWidth] = useState(null);
  const [step, setStep] = useState(null);

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    const { actor } = viewport.getActors()[0];
    const mapper = actor.getMapper();
    const image = mapper.getInputData();
    const scalarRange = image.getPointData().getScalars().getRange();

    setImageDataRange(scalarRange);
    if (scalarRange) {
      const mappingWidth = scalarRange[1] - scalarRange[0];
      setFullMappingRangeWidth(mappingWidth);
      setMinShift(-mappingWidth / 2);
      setMaxShift(mappingWidth / 2);
      setMaxWidth(mappingWidth * 2);
      setRangeWidth(mappingWidth);
      setRangeShift(0);
      const calculatedStep = Math.min(1, mappingWidth / 256);
      setStep(calculatedStep > 1 ? Math.round(calculatedStep) : calculatedStep);
    }
  }, [cornerstoneViewportService, viewportId]);

  const onChangeRange = useCallback(
    (shift, width) => {
      commandsManager.runCommand('setVolumeMappingRange', {
        viewportId,
        shift,
        width,
        imageDataRange,
        fullMappingRangeWidth,
      });
    },
    [commandsManager, viewportId, imageDataRange, fullMappingRangeWidth]
  );

  return (
    <>
      <div className="pb-1 text-[14px]">Mapping Range</div>
      <label
        className="text-aqua-pale block text-sm font-medium"
        htmlFor="shift"
      >
        Shift
      </label>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 dark:bg-gray-700"
        value={rangeShift || ''}
        onChange={e => {
          const shiftValue = parseInt(e.target.value, 10);
          setRangeShift(shiftValue);
          onChangeRange(shiftValue, rangeWidth);
        }}
        id="shift"
        max={maxShift}
        min={minShift}
        type="range"
        step={step}
      />
      <label
        className="text-aqua-pale block text-sm font-medium"
        htmlFor="width"
      >
        Width
      </label>
      <input
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 dark:bg-gray-700"
        value={rangeWidth || ''}
        onChange={e => {
          const widthValue = parseInt(e.target.value, 10);
          setRangeWidth(widthValue);
          onChangeRange(rangeShift, widthValue);
        }}
        id="width"
        max={maxWidth}
        min={1}
        type="range"
        step={step}
      />
    </>
  );
}
