import React from 'react';
import classNames from 'classnames';
import {
  ButtonGroup,
  InputNumber,
  InputRange,
  LegacyButton,
} from '../../components';

function ToolSettings({ options }) {
  return (
    <div className="text-white py-2 space-y-2">
      {options?.map(option => {
        if (option.type === 'range') {
          return (
            <div className="flex space-x-2 items-center" key={option.name}>
              <div className="text-xs w-1/3 text-[13px]">{option.name}</div>
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
            <div
              className="flex justify-between items-center text-[13px]"
              key={option.name}
            >
              <span className="w-1/3">{option.name}</span>
              <div className="">
                <ButtonGroup
                  color="secondary"
                  splitBorder={false}
                  className={'ml-auto'}
                >
                  {option.values?.map(({ label, value: optionValue }) => {
                    const isActive = option.value === optionValue;
                    return (
                      <LegacyButton
                        key={label}
                        className={classNames(
                          `${isActive ? 'text-white' : 'text-primary-active'}`,
                          'p-1 w-20'
                        )}
                        size="inherit"
                        bgColor={isActive ? 'bg-primary-main' : 'bg-black'}
                      >
                        {label}
                      </LegacyButton>
                    );
                  })}
                </ButtonGroup>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

export default ToolSettings;
