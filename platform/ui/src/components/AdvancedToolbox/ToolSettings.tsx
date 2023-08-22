import React from 'react';
import { InputNumber, InputRange } from '../../components';

function ToolSettings({ options }) {
  return (
    <div className="text-white py-2">
      {options?.map(option => {
        if (option.type === 'range') {
          return (
            <div className="flex space-x-2 items-center" key={option.name}>
              <div className="text-xs w-1/3">{option.name}</div>
              <InputRange
                minValue={option.min}
                maxValue={option.max}
                step={option.step}
                value={option.value}
                onChange={e => option.onChange(e)}
                allowNumberEdit={true}
                showAdjustmentArrows={false}
              />
            </div>
          );
        }

        if (option.type === 'radio') {
          return (
            <div className="flex flex-col" key={option.name}>
              <span className="text-xs">{option.name}</span>
              <div className="flex">
                {option.values?.map(({ value, label }) => {
                  return (
                    <div
                      className="flex flex-col items-center justify-center"
                      key={value}
                    >
                      <input
                        type="radio"
                        name={option.name}
                        value={value}
                        onChange={e => option.onChange(e.target.value)}
                        defaultChecked={option.value === value}
                      />
                      <span className="text-xs">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

export default ToolSettings;
