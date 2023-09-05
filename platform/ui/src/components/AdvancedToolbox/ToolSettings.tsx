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
    <div className="text-white py-2 space-y-2">
      {options?.map(option => {
        if (option.type === 'range') {
          return (
            <div className="flex items-center" key={option.name}>
              <div className="text-xs w-1/3 text-[13px]">{option.name}</div>
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
              className="flex justify-between items-center text-[13px]"
              key={option.name}
            >
              <span>{option.name}</span>
              <div className="max-w-1/2">
                <ButtonGroup
                  buttons={getButtons(option)}
                  defaultActiveIndex={option.defaultActiveIndex}
                  key={option.name}
                  size={ButtonEnums.size.small}
                />
              </div>
            </div>
          );
        }
        if (option.type === 'custom') {
          return (
            <div key={option.name}>
              {typeof option.children === 'function'
                ? option.children()
                : option.children}
            </div>
          );
        }
      })}
    </div>
  );
}

export default ToolSettings;
