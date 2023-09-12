import React from 'react';
import { ButtonGroup, InputRange, ButtonEnums } from '../../components';

function ToolSettings({ options }) {
  if (!options) {
    return null;
  }

  const getButtons = option => {
    const buttons = [];

    option.values?.map(({ label, value: optionValue }, index) => {
      buttons.push({
        children: label,
        onClick: () => option.onChange(optionValue),
        key: `button-${option.name}-${index}`, // A unique key
      });
    });

    return buttons;
  };

  return (
    <div className="space-y-2 py-2 text-white">
      {options?.map(option => {
        if (option.type === 'range') {
          return (
            <div
              className="flex items-center"
              key={option.id}
            >
              <div className="w-1/3 text-xs text-[13px]">{option.name}</div>
              <div className="w-2/3">
                <InputRange
                  minValue={option.min}
                  maxValue={option.max}
                  step={option.step}
                  value={option.value}
                  onChange={e => option.onChange(e)}
                  allowNumberEdit={true}
                  showAdjustmentArrows={false}
                  inputClassName="ml-2 w-4/5"
                />
              </div>
            </div>
          );
        }

        if (option.type === 'radio') {
          return (
            <div
              className="flex items-center justify-between text-[13px]"
              key={option.id}
            >
              <span>{option.name}</span>
              <div className="max-w-1/2">
                <ButtonGroup
                  buttons={getButtons(option)}
                  defaultActiveIndex={option.defaultActiveIndex}
                  size={ButtonEnums.size.small}
                />
              </div>
            </div>
          );
        }
        if (option.type === 'custom') {
          return (
            <div key={option.id}>
              {typeof option.children === 'function' ? option.children() : option.children}
            </div>
          );
        }
      })}
    </div>
  );
}

export default ToolSettings;
