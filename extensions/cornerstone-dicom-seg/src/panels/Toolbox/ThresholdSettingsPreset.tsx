import React, { useState } from 'react';
import { InputDoubleRange, Select } from '@ohif/ui';

const defaultOptions = [
  {
    value: 'Soft tissue',
    label: 'Soft tissue',
    range: [-160, 240] as [number, number],
  },
  {
    value: 'Lung',
    label: 'Lung',
    range: [-1350, 150] as [number, number],
  },
  {
    value: 'Liver',
    label: 'Liver',
    range: [15, 165] as [number, number],
  },
  {
    value: 'Bone',
    label: 'Bone',
    range: [-770, 1730] as [number, number],
  },
  {
    value: 'Brain',
    label: 'Brain',
    range: [0, 80] as [number, number],
  },
];

function ThresholdSettings({ onRangeChange }) {
  const [options, setOptions] = useState(defaultOptions);
  const [selectedPreset, setSelectedPreset] = useState(defaultOptions[0].value);

  const handleRangeChange = newRange => {
    const selectedOption = options.find(o => o.value === selectedPreset);

    if (newRange[0] === selectedOption.range[0] && newRange[1] === selectedOption.range[1]) {
      return;
    }

    onRangeChange(newRange);

    const updatedOptions = options.map(o => {
      if (o.value === selectedPreset) {
        return {
          ...o,
          range: newRange,
        };
      }
      return o;
    });

    setOptions(updatedOptions);
  };

  const selectedPresetRange = options.find(ds => ds.value === selectedPreset).range;

  return (
    <div>
      <div className="bg-secondary-light h-[1px]"></div>
      <div className="mt-1 text-[13px] text-white">Threshold</div>
      <div className="mt-1 w-1/2">
        <Select
          isClearable={false}
          onChange={handlePresetChange}
          options={options}
          value={options.find(ds => ds.value === selectedPreset)}
          className="text-white"
          isSearchable={false}
        />
      </div>
      <InputDoubleRange
        values={selectedPresetRange}
        onChange={handleRangeChange}
        minValue={-1000}
        maxValue={1000}
        step={1}
        showLabel={true}
        allowNumberEdit={true}
        showAdjustmentArrows={false}
      />
    </div>
  );
}

export default ThresholdSettings;
