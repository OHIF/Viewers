import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon, InputRange, CheckBox, InputNumber } from '../';
import classNames from 'classnames';

const ActiveSegmentationConfig = ({ onConfigChange }) => {
  return (
    <div className="flex text-[12px] px-2 pt-[13px] space-x-6">
      <div className="flex flex-col items-start">
        <div className="text-white mb-[12px]">Active</div>
        <CheckBox
          label="Outline"
          checked={true}
          labelClassName="text-[12px] pl-1 pt-1"
          className="mb-[9px]"
          onChange={value => {
            onConfigChange({ active: { outline: value } });
          }}
        />
        <CheckBox
          label="Fill"
          checked={true}
          labelClassName="text-[12px] pl-1 pt-1"
          className="mb-[9px]"
          onChange={value => {
            onConfigChange({ active: { fill: value } });
          }}
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="text-[#b3b3b3] text-[10px] mb-[12px]">Opacity</div>
        <InputRange
          minValue={0}
          maxValue={100}
          value={50}
          onChange={() => {}}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
        <InputRange
          minValue={0}
          maxValue={100}
          value={50}
          onChange={() => {}}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="text-[#b3b3b3] text-[10px] mb-[12px]">Size</div>
        <InputNumber value={1} onChange={() => {}} className="-mt-1" />
      </div>
    </div>
  );
};

const InactiveSegmentationConfig = ({ onConfigChange }) => {
  return (
    <div className="pl-2 mt-1">
      <CheckBox
        label="Display Inactive Segmentations"
        checked={true}
        labelClassName="text-[12px] pl-1 pt-1"
        className="mb-[9px]"
        onChange={value => {
          onConfigChange({ inactive: { show: value } });
        }}
      />

      <div className="flex pl-4 items-center space-x-2">
        <span className="text-[10px] text-[#b3b3b3]">Opacity</span>
        <InputRange
          minValue={0}
          maxValue={100}
          value={50}
          onChange={() => {}}
          step={1}
          containerClassName="mt-[4px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
      </div>
    </div>
  );
};

const SegmentationConfig = ({ onConfigChange }) => {
  const [isMinimized, setIsMinimized] = useState(true);
  return (
    <>
      {/* active segmentation */}
      <ActiveSegmentationConfig onConfigChange={onConfigChange} />

      {/* A small line  */}
      <div className="h-[1px] bg-[#212456] mb-[8px] mx-3"></div>

      {/* inactive segmentation */}
      <div
        onClick={() => setIsMinimized(!isMinimized)}
        className="flex items-center cursor-pointer pl-[4px] pb-[9px]"
      >
        <Icon
          name="panel-group-open-close"
          onClick={evt => {
            evt.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          className={classNames(
            'w-5 h-5 text-white transition duration-300 cursor-pointer',
            {
              'transform rotate-90': !isMinimized,
            }
          )}
        />
        <span className="text-[#d8d8d8] text-[12px] font-[300]">
          {'Inactive Segmentations'}
        </span>
      </div>
      {!isMinimized && (
        <InactiveSegmentationConfig onConfigChange={onConfigChange} />
      )}
      <div className="h-[6px] bg-black "></div>
    </>
  );
};

SegmentationConfig.propTypes = {};

export default SegmentationConfig;
