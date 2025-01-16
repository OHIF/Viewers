import React from 'react';
import { InputRange } from '@ohif/ui-next';
import { RowSegmentedControl } from '@ohif/ui-next';
import { RowDoubleRange } from '@ohif/ui-next';

const SETTING_TYPES = {
  RANGE: 'range',
  RADIO: 'radio',
  CUSTOM: 'custom',
  DOUBLE_RANGE: 'double-range',
};

function ToolSettings({ options }) {
  if (!options) {
    return null;
  }

  if (typeof options === 'function') {
    return options();
  }

  return (
    <div className="space-y-2 py-2 text-white">
      {options?.map(option => {
        if (option.condition && option.condition?.({ options }) === false) {
          return null;
        }

        switch (option.type) {
          case SETTING_TYPES.RANGE:
            return renderRangeSetting(option);
          case SETTING_TYPES.RADIO:
            return renderRadioSetting(option);
          case SETTING_TYPES.DOUBLE_RANGE:
            return renderDoubleRangeSetting(option);
          case SETTING_TYPES.CUSTOM:
            return renderCustomSetting(option);
          default:
            return null;
        }
      })}
    </div>
  );
}

const renderRangeSetting = option => {
  return (
    <div
      className="flex items-center"
      key={option.id}
    >
      <div className="w-1/3 text-[13px]">{option.name}</div>
      <div className="w-2/3">
        <InputRange
          minValue={option.min}
          maxValue={option.max}
          step={option.step}
          value={option.value}
          onChange={value => option.commands?.(value)}
          allowNumberEdit={true}
          showAdjustmentArrows={false}
          inputClassName="ml-1 w-4/5 cursor-pointer"
        />
      </div>
    </div>
  );
};

const renderRadioSetting = option => {
  return (
    <RowSegmentedControl
      key={option.id}
      option={option}
    />
  );
};

function renderDoubleRangeSetting(option) {
  return (
    <RowDoubleRange
      key={option.id}
      values={option.value}
      onChange={option.commands}
      minValue={option.min}
      maxValue={option.max}
      step={option.step}
      showLabel={false}
      allowNumberEdit={true}
      containerClassName="w-full"
    />
  );
}

const renderCustomSetting = option => {
  return (
    <div key={option.id}>
      {typeof option.children === 'function' ? option.children() : option.children}
    </div>
  );
};

export default ToolSettings;
