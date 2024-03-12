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

    const mappingWidth = scalarRange[1] - scalarRange[0];
    setFullMappingRangeWidth(mappingWidth);

    setMinShift(-mappingWidth / 2);
    setMaxShift(mappingWidth / 2);
    setMaxWidth(mappingWidth * 2);

    const calculatedStep = Math.min(1, mappingWidth / 256);

    setStep(calculatedStep > 1 ? Math.round(calculatedStep) : calculatedStep);

    const cfun = actor.getProperty().getRGBTransferFunction(0);
    const [min, max] = cfun.getMappingRange();

    const width = max - min;
    const expectedMin = scalarRange[0] + (mappingWidth - width) / 2;
    const shift = min - expectedMin;

    setRangeShift(shift);
    setRangeWidth(width);
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
        {rangeShift !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            value={rangeShift}
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
            style={{
              background: calculateBackground((rangeShift - minShift) / (maxShift - minShift)),
            }}
          />
        )}
      </div>
      <div className="all-in-one-menu-item flex  w-full flex-row !items-center justify-between gap-[10px]">
        <label
          className="block  text-white"
          htmlFor="width"
        >
          Width
        </label>
        {rangeWidth !== null && (
          <input
            className="bg-inputfield-main h-2 w-[120px] cursor-pointer appearance-none rounded-lg"
            value={rangeWidth}
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
            style={{ background: calculateBackground((rangeWidth - 1) / (maxWidth - 1)) }}
          />
        )}
      </div>
    </>
  );
}
