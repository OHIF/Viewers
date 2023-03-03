import React, { useState } from 'react';
import { Icon, InputRange, CheckBox, InputNumber } from '../';
import classNames from 'classnames';
import { reducer } from './segmentationConfigReducer';

const ActiveSegmentationConfig = ({
  config,
  dispatch,
  setRenderOutline,
  setOutlineOpacityActive,
  setOutlineWidthActive,
  setRenderFill,
  setFillAlpha,
  usePercentage,
}) => {
  const [
    useOutlineOpacityPercentage,
    setUseOutlineOpacityPercentage,
  ] = useState(usePercentage);

  const [useFillAlphaPercentage, setUseFillAlphaPercentage] = useState(
    usePercentage
  );

  return (
    <div className="flex justify-between text-[12px] pt-[13px] px-2">
      <div className="flex flex-col items-start">
        <div className="text-white mb-[12px]">Active</div>
        <CheckBox
          label="Outline"
          checked={config.renderOutline}
          labelClassName="text-[12px] pl-1 pt-1"
          className="mb-[9px]"
          onChange={value => {
            dispatch({
              type: 'RENDER_OUTLINE',
              payload: {
                value,
              },
            });

            setRenderOutline(value);
          }}
        />
        <CheckBox
          label="Fill"
          checked={config.renderFill}
          labelClassName="text-[12px] pl-1 pt-1"
          className="mb-[9px]"
          onChange={value => {
            dispatch({
              type: 'RENDER_FILL',
              payload: {
                value,
              },
            });

            setRenderFill(value);
          }}
        />
      </div>

      <div className="flex flex-col items-center col-span-2">
        <div className="text-[#b3b3b3] text-[10px] mb-[12px]">Opacity</div>
        <InputRange
          minValue={0}
          maxValue={usePercentage ? 100 : 1}
          value={
            useOutlineOpacityPercentage
              ? config.outlineOpacity * 100
              : config.outlineOpacity
          }
          onChange={value => {
            setUseOutlineOpacityPercentage(false);
            dispatch({
              type: 'SET_OUTLINE_OPACITY',
              payload: {
                value: value,
              },
            });

            setOutlineOpacityActive(value);
          }}
          step={1}
          containerClassName="mt-[4px] mb-[9px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
        <InputRange
          minValue={0}
          maxValue={usePercentage ? 100 : 1}
          value={
            useFillAlphaPercentage ? config.fillAlpha * 100 : config.fillAlpha
          }
          onChange={value => {
            setUseFillAlphaPercentage(false);
            dispatch({
              type: 'SET_FILL_ALPHA',
              payload: {
                value,
              },
            });

            setFillAlpha(value);
          }}
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
          onChange={value => {
            dispatch({
              type: 'SET_OUTLINE_WIDTH',
              payload: {
                value,
              },
            });

            setOutlineWidthActive(value);
          }}
          className="-mt-1"
        />
      </div>
    </div>
  );
};

const InactiveSegmentationConfig = ({
  config,
  dispatch,
  setRenderInactiveSegmentations,
  setFillAlphaInactive,
  usePercentage,
}) => {
  const [
    useFillAlphaInactivePercentage,
    setUseFillInactivePercentage,
  ] = useState(usePercentage);

  return (
    <div className="px-2">
      <CheckBox
        label="Display Inactive Segmentations"
        checked={config.renderInactiveSegmentations}
        labelClassName="text-[12px] pt-1"
        className="mb-[9px]"
        onChange={value => {
          dispatch({
            type: 'RENDER_INACTIVE_SEGMENTATIONS',
            payload: {
              value,
            },
          });

          setRenderInactiveSegmentations(value);
        }}
      />

      <div className="flex pl-4 items-center space-x-2">
        <span className="text-[10px] text-[#b3b3b3]">Opacity</span>
        <InputRange
          minValue={0}
          maxValue={usePercentage ? 100 : 1}
          value={
            useFillAlphaInactivePercentage
              ? config.fillAlphaInactive * 100
              : config.fillAlphaInactive
          }
          onChange={value => {
            setUseFillInactivePercentage(false);
            dispatch({
              type: 'SET_FILL_ALPHA_INACTIVE',
              payload: {
                value: value,
              },
            });

            setFillAlphaInactive(value);
          }}
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
  const [config, dispatch] = React.useReducer(
    reducer,
    segmentationConfig.initialConfig
  );

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
            config={config}
            dispatch={dispatch}
            setFillAlpha={setFillAlpha}
            setOutlineWidthActive={setOutlineWidthActive}
            setOutlineOpacityActive={setOutlineOpacityActive}
            setRenderFill={setRenderFill}
            setRenderOutline={setRenderOutline}
            usePercentage={segmentationConfig.usePercentage}
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
            config={config}
            dispatch={dispatch}
            setRenderInactiveSegmentations={setRenderInactiveSegmentations}
            setFillAlphaInactive={setFillAlphaInactive}
            usePercentage={segmentationConfig.usePercentage}
          />
        </div>
      )}
      <div className="h-[6px] bg-black "></div>
    </div>
  );
};

SegmentationConfig.propTypes = {};

export default SegmentationConfig;
