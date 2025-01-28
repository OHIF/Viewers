import React from 'react';
import RowInputRange from './RowInputRange';
import RowSegmentedControl from './RowSegmentedControl';
import RowDoubleRange from './RowDoubleRange';

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
    <div className="text-foreground space-y-2 pb-4">
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
        <RowInputRange
          minValue={option.min}
          maxValue={option.max}
          step={option.step}
          value={option.value}
          onChange={value => option.commands?.(value)}
          allowNumberEdit={true}
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
