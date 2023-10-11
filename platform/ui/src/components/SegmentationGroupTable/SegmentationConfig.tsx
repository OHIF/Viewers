import React, { useState } from 'react';
import Icon from '../Icon';
import InputRange from '../InputRange';
import CheckBox from '../CheckBox';
import InputNumber from '../InputNumber';
import classNames from 'classnames';

const getRoundedValue = value => {
  return Math.round(value * 100) / 100;
};

const ActiveSegmentationConfig = ({
  config,
  setRenderOutline,
  setOutlineOpacityActive,
  setOutlineWidthActive,
  setRenderFill,
  setFillAlpha,
}) => {
  return (
    <div className="flex justify-between px-3 pt-[13px] text-[12px]">
      <div className="flex flex-col items-start">
        <div className="mb-[12px] text-white">Active</div>
        <CheckBox
          label="Outline"
          checked={config.renderOutline}
          labelClassName="text-[12px] pl-1 pt-1"
          className="mb-[9px]"
          onChange={setRenderOutline}
        />
        <CheckBox
          label="Fill"
          checked={config.renderFill}
          labelClassName="text-[12px] pl-1 pt-1"
          className="mb-[9px]"
          onChange={setRenderFill}
        />
      </div>

      <div className="col-span-2 flex flex-col items-center">
        <div className="mb-[12px] text-[10px] text-[#b3b3b3]">Opacity</div>
        <InputRange
          minValue={0}
          maxValue={100}
          value={getRoundedValue(config.outlineOpacity * 100)}
          onChange={setOutlineOpacityActive}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
        <InputRange
          minValue={4}
          maxValue={100}
          value={getRoundedValue(config.fillAlpha * 100)}
          onChange={setFillAlpha}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="mb-[12px] text-[10px] text-[#b3b3b3]">Size</div>
        <InputNumber
          value={config.outlineWidthActive}
          onChange={setOutlineWidthActive}
          minValue={0}
          maxValue={10}
          className="-mt-1"
        />
      </div>
    </div>
  );
};

const InactiveSegmentationConfig = ({
  config,
  setRenderInactiveSegmentations,
  setFillAlphaInactive,
}) => {
  return (
    <div className="px-3">
      <CheckBox
        label="Display Inactive Segmentations"
        checked={config.renderInactiveSegmentations}
        labelClassName="text-[12px]"
        className="mb-[9px]"
        onChange={setRenderInactiveSegmentations}
      />

      <div className="flex items-center space-x-2 pl-4">
        <span className="text-[10px] text-[#b3b3b3]">Opacity</span>
        <InputRange
          minValue={0}
          maxValue={100}
          value={getRoundedValue(config.fillAlphaInactive * 100)}
          onChange={setFillAlphaInactive}
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

const SegmentationConfig = ({
  segmentationConfig,
  setFillAlpha,
  setFillAlphaInactive,
  setOutlineWidthActive,
  setOutlineOpacityActive,
  setRenderFill,
  setRenderInactiveSegmentations,
  setRenderOutline,
}) => {
  const { initialConfig } = segmentationConfig;
  const [isMinimized, setIsMinimized] = useState(true);
  return (
    <div className="bg-primary-dark select-none">
      <div>
        <ActiveSegmentationConfig
          config={initialConfig}
          setFillAlpha={setFillAlpha}
          setOutlineWidthActive={setOutlineWidthActive}
          setOutlineOpacityActive={setOutlineOpacityActive}
          setRenderFill={setRenderFill}
          setRenderOutline={setRenderOutline}
        />
        <div className="mx-1 mb-[8px] h-[1px] bg-[#212456]"></div>
        <div
          onClick={() => setIsMinimized(!isMinimized)}
          className="flex cursor-pointer items-center pl-2 pb-[9px]"
        >
          <Icon
            name="panel-group-open-close"
            className={classNames('h-5 w-5 cursor-pointer text-white transition duration-300', {
              'rotate-90 transform': !isMinimized,
            })}
          />
          <span className="text-[12px] font-[300] text-[#d8d8d8]">{'Inactive Segmentations'}</span>
        </div>
        {!isMinimized && (
          <InactiveSegmentationConfig
            config={initialConfig}
            setRenderInactiveSegmentations={setRenderInactiveSegmentations}
            setFillAlphaInactive={setFillAlphaInactive}
          />
        )}
      </div>
      <div className="h-[6px] bg-black "></div>
    </div>
  );
};

SegmentationConfig.propTypes = {};

export default SegmentationConfig;
