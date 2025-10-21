import React, { useState } from 'react';
import RowInputRange from './RowInputRange';
import RowSegmentedControl from './RowSegmentedControl';
import RowDoubleRange from './RowDoubleRange';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Label } from '../Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Switch } from '../Switch';

const SETTING_TYPES = {
  RANGE: 'range',
  RADIO: 'radio',
  CUSTOM: 'custom',
  DOUBLE_RANGE: 'double-range',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  SWITCH: 'switch',
  SELECT: 'select',
};

function ToolSettings({ options }) {
  if (!options) {
    return null;
  }

  if (typeof options === 'function') {
    const OptionsComponent = options;
    return <OptionsComponent />;
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
          case SETTING_TYPES.BUTTON:
            return renderButtonSetting(option);
          case SETTING_TYPES.CHECKBOX:
            return renderCheckboxSetting(option);
          case SETTING_TYPES.SWITCH:
            return renderSwitchSetting(option);
          case SETTING_TYPES.SELECT:
            return renderSelectSetting(option);
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
      <div
        className="w-2/3"
        data-cy={option.id}
      >
        <RowInputRange
          minValue={option.min}
          maxValue={option.max}
          step={option.step}
          value={option.value}
          onChange={value => option.onChange?.(value)}
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
      onChange={option.onChange}
    />
  );
};

function renderDoubleRangeSetting(option) {
  return (
    <RowDoubleRange
      key={option.id}
      values={option.value}
      onChange={option.onChange}
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

const renderButtonSetting = option => {
  return (
    <Button
      key={option.id}
      variant="ghost"
      onClick={() => option.onChange()}
    >
      {option.name}
    </Button>
  );
};

const renderCheckboxSetting = option => {
  return (
    <div
      key={option.id}
      className="flex items-center gap-2"
    >
      <Checkbox
        id={option.id}
        checked={option.value}
        onCheckedChange={checked => {
          option.onChange?.(checked);
        }}
      />
      <Label
        htmlFor={option.id}
        className="cursor-pointer"
      >
        {option.name}
      </Label>
    </div>
  );
};

const renderSwitchSetting = option => {
  return (
    <div
      key={option.id}
      className="flex items-center gap-2"
    >
      <Switch
        id={option.id}
        checked={option.value}
        onCheckedChange={checked => {
          option.onChange?.(checked);
        }}
      />
      <Label
        htmlFor={option.id}
        className="cursor-pointer"
      >
        {option.name}
      </Label>
    </div>
  );
};

const renderSelectSetting = option => {
  return (
    <Select
      key={option.id}
      onValueChange={value => option.onChange?.(value)}
      value={option.value}
    >
      <SelectTrigger className="w-full overflow-hidden">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {option.values.map(value => (
          <SelectItem
            key={value.id}
            value={value.id}
          >
            {value.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ToolSettings;
