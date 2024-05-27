import React from 'react';
import { ButtonGroup, InputDoubleRange, InputRange } from '../../components';

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
  const renderButtons = option => {
    return option.values?.map(({ label, value: optionValue }, index) => (
      <button
        onClick={() => {
          option.commands?.(optionValue);
        }}
        key={`button-${option.id}-${index}`}
      >
        {label}
      </button>
    ));
  };

  return (
    <div
      className="flex items-center justify-between text-[13px]"
      key={option.id}
    >
      <span>{option.name}</span>
      <div className="max-w-1/2">
        <ButtonGroup
          className="border-secondary-light rounded-md border"
          activeIndex={option.values.findIndex(({ value }) => value === option.value) || 0}
        >
          {renderButtons(option)}
        </ButtonGroup>
      </div>
    </div>
  );
};

const renderDoubleRangeSetting = option => {
  return (
    <div
      className="flex w-full items-center"
      key={option.id}
    >
      <InputDoubleRange
        values={option.value}
        onChange={option.commands}
        minValue={option.min}
        maxValue={option.max}
        step={option.step}
        showLabel={true}
        allowNumberEdit={true}
        showAdjustmentArrows={false}
        containerClassName="w-full"
      />
    </div>
  );
};

const renderCustomSetting = option => {
  return (
    <div key={option.id}>
      {typeof option.children === 'function' ? option.children() : option.children}
    </div>
  );
};

export default ToolSettings;
