import React, { useState } from 'react';
import classNames from 'classnames';

import Icon from '../Icon';
import InputRange from '../InputRange';
import CheckBox from '../CheckBox';
import InputNumber from '../InputNumber';

const ActiveSegmentationConfig = ({
  config,
  setRenderOutline,
  setOutlineOpacityActive,
  setOutlineWidthActive,
  setRenderFill,
  setFillAlpha,
}) => {
  return (
    <div className="flex justify-between text-[12px] pt-[13px] px-2">
      <div className="flex flex-col items-start">
        <div className="text-white mb-[12px]">Active</div>
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

      <div className="flex flex-col items-center col-span-2">
        <div className="text-[#b3b3b3] text-[10px] mb-[12px]">Opacity</div>
        <InputRange
          minValue={0}
          maxValue={100}
          value={config.outlineOpacity * 100}
          onChange={setOutlineOpacityActive}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
        <InputRange
          minValue={0}
          maxValue={100}
          value={config.fillAlpha * 100}
          onChange={setFillAlpha}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="text-[#b3b3b3] text-[10px] mb-[12px]">Size</div>
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
    <div className="px-2">
      <CheckBox
        label="Display Inactive Segmentations"
        checked={config.renderInactiveSegmentations}
        labelClassName="text-[12px] pt-1"
        className="mb-[9px]"
        onChange={setRenderInactiveSegmentations}
      />

      <div className="flex pl-4 items-center space-x-2">
        <span className="text-[10px] text-[#b3b3b3]">Opacity</span>
        <InputRange
          minValue={0}
          maxValue={100}
          value={config.fillAlphaInactive * 100}
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
    <div className="bg-primary-dark">
      <div
        className="flex cursor-pointer items-center"
        onClick={evt => {
          evt.stopPropagation();
          setIsMinimized(!isMinimized);
        }}
      >
        <Icon
          name="panel-group-open-close"
          className={classNames(
            'w-5 h-5 text-white transition duration-300 cursor-pointer',
            {
              'transform rotate-90': !isMinimized,
            }
          )}
        />
        <span className="text-[#d8d8d8] text-[12px] font-[300]">
          {'Segmentation Appearance'}
        </span>
      </div>
      {/* active segmentation */}
      {!isMinimized && (
        <div>
          <ActiveSegmentationConfig
            config={initialConfig}
            setFillAlpha={setFillAlpha}
            setOutlineWidthActive={setOutlineWidthActive}
            setOutlineOpacityActive={setOutlineOpacityActive}
            setRenderFill={setRenderFill}
            setRenderOutline={setRenderOutline}
          />
          {/* A small line  */}
          <div className="h-[1px] bg-[#212456] mb-[8px] mx-1"></div>
          {/* inactive segmentation */}
          <div
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center cursor-pointer pl-2 pb-[9px]"
          >
            <span className="text-[#d8d8d8] text-[12px] font-[300]">
              {'Inactive Segmentations'}
            </span>
          </div>
          <InactiveSegmentationConfig
            config={initialConfig}
            setRenderInactiveSegmentations={setRenderInactiveSegmentations}
            setFillAlphaInactive={setFillAlphaInactive}
          />
        </div>
      )}
      <div className="h-[6px] bg-black "></div>
    </div>
  );
};

SegmentationConfig.propTypes = {};

export default SegmentationConfig;
