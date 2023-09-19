import React, { useCallback, ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Range, VOIRange, voiRangePropType, rangePropType } from './types';

const WindowLevelSlider = ({
  step,
  range,
  voiRange,
  onVOIRangeChange,
}: {
  step: number;
  range: Range;
  voiRange: VOIRange;
  onVOIRangeChange: (voiRange: VOIRange) => void;
}): ReactElement => {
  const minVOIPercent = ((voiRange.min - range.min) / (range.max - range.min)) * 100;
  const maxVoiPercent = (1 - (range.max - voiRange.max) / (range.max - range.min)) * 100;

  const handleMinRangeChange = useCallback(
    e => {
      const newMinVOIValue = Number(e.target.value);

      if (newMinVOIValue >= voiRange.max) {
        return;
      }

      onVOIRangeChange({
        min: newMinVOIValue,
        max: voiRange.max,
      });
    },
    [voiRange, onVOIRangeChange]
  );

  const handleMaxRangeChange = useCallback(
    e => {
      const newMaxVOIValue = Number(e.target.value);

      if (newMaxVOIValue <= voiRange.min) {
        return;
      }

      onVOIRangeChange({
        min: voiRange.min,
        max: newMaxVOIValue,
      });
    },
    [voiRange, onVOIRangeChange]
  );

  return (
    <div className="relative">
      <input
        id="minRange"
        type="range"
        min={range.min}
        max={range.max}
        value={voiRange.min}
        className="input-range-thumb-design pointer-events-none h-[3px] w-full appearance-none rounded-lg"
        style={{
          background: `linear-gradient(to right, #3a3f99 0%, #3a3f99 ${minVOIPercent}%, #5acce6 ${minVOIPercent}%, #5acce6 ${maxVoiPercent}%, #3a3f99 ${maxVoiPercent}%, #3a3f99 100%)`,
        }}
        onChange={handleMinRangeChange}
        step={step}
      />

      <input
        id="maxRange"
        type="range"
        min={range.min}
        max={range.max}
        value={voiRange.max}
        className="input-range-thumb-design pointer-events-none mt-[-3px] h-[3px] w-full appearance-none rounded-lg bg-transparent"
        onChange={handleMaxRangeChange}
        step={step}
      />
    </div>
  );
};

WindowLevelSlider.defaultProps = {
  step: 1,
};

WindowLevelSlider.propTypes = {
  step: PropTypes.number,
  voiRange: voiRangePropType.isRequired,
  range: rangePropType.isRequired,
  onVOIRangeChange: PropTypes.func.isRequired,
};

export default WindowLevelSlider;
