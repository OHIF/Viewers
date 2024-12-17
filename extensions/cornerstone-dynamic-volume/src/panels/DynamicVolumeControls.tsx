import React, { useState } from 'react';
import { Button, PanelSection, ButtonGroup, IconButton, InputNumber, Tooltip } from '@ohif/ui';

import { DoubleSlider, Icons } from '@ohif/ui-next';

import { Enums } from '@cornerstonejs/core';

const controlClassNames = {
  sizeClassName: 'w-[58px] h-[28px]',
  arrowsDirection: 'horizontal',
  labelPosition: 'bottom',
};

const Header = ({ title, tooltip }) => (
  <div className="flex items-center space-x-1">
    <Tooltip
      content={<div className="text-white">{tooltip}</div>}
      position="bottom-left"
      tight={true}
      tooltipBoxClassName="max-w-xs p-2"
    >
      <Icons.ByName
        name="info-link"
        className="text-primary-active h-[14px] w-[14px]"
      />
    </Tooltip>
    <span className="text-aqua-pale text-[11px] uppercase">{title}</span>
  </div>
);

const DynamicVolumeControls = ({
  isPlaying,
  onPlayPauseChange,
  // fps
  fps,
  onFpsChange,
  minFps,
  maxFps,
  // Frames
  currentFrameIndex,
  onFrameChange,
  framesLength,
  onGenerate,
  onDoubleRangeChange,
  onDynamicClick,
}) => {
  const [computedView, setComputedView] = useState(false);

  const [computeViewMode, setComputeViewMode] = useState(Enums.DynamicOperatorType.SUM);

  const [sliderRangeValues, setSliderRangeValues] = useState([0, framesLength - 1]);

  const handleSliderChange = newValues => {
    onDoubleRangeChange(newValues);
    setSliderRangeValues(newValues);
  };

  const formatLabel = value => Math.round(value);

  return (
    <div className="flex select-none flex-col">
      <PanelSection
        title="Controls"
        childrenClassName="space-y-4 pb-5 px-5"
      >
        <div className="mt-2">
          <Header
            title="View"
            tooltip={
              'Select the view mode, 4D to view the dynamic volume or Computed to view the computed volume'
            }
          />
          <ButtonGroup className="mt-2 w-full">
            <button
              className="w-1/2"
              onClick={() => {
                setComputedView(false);
                onDynamicClick?.();
              }}
            >
              4D
            </button>
            <button
              className="w-1/2"
              onClick={() => {
                setComputedView(true);
              }}
            >
              Computed
            </button>
          </ButtonGroup>
        </div>
        <div>
          <FrameControls
            onPlayPauseChange={onPlayPauseChange}
            isPlaying={isPlaying}
            computedView={computedView}
            // fps
            fps={fps}
            onFpsChange={onFpsChange}
            minFps={minFps}
            maxFps={maxFps}
            //
            framesLength={framesLength}
            onFrameChange={onFrameChange}
            currentFrameIndex={currentFrameIndex}
          />
        </div>
        <div className={`mt-6 flex flex-col ${computedView ? '' : 'ohif-disabled'}`}>
          <Header
            title="Computed Operation"
            tooltip={
              <div>
                Operation Buttons (SUM, AVERAGE, SUBTRACT): Select the mathematical operation to be
                applied to the data set.
                <br></br> Range Slider: Choose the numeric range within which the operation will be
                performed.
                <br></br>Generate Button: Execute the chosen operation on the specified range of
                data.{' '}
              </div>
            }
          />
          <ButtonGroup
            className={`mt-2 w-full`}
            separated={true}
          >
            <button
              className="w-1/2"
              onClick={() => setComputeViewMode(Enums.DynamicOperatorType.SUM)}
            >
              {Enums.DynamicOperatorType.SUM.toString().toUpperCase()}
            </button>
            <button
              className="w-1/2"
              onClick={() => setComputeViewMode(Enums.DynamicOperatorType.AVERAGE)}
            >
              {Enums.DynamicOperatorType.AVERAGE.toString().toUpperCase()}
            </button>
            <button
              className="w-1/2"
              onClick={() => setComputeViewMode(Enums.DynamicOperatorType.SUBTRACT)}
            >
              {Enums.DynamicOperatorType.SUBTRACT.toString().toUpperCase()}
            </button>
          </ButtonGroup>
          <div className="mt-2 w-full">
            <DoubleSlider
              min={0}
              max={framesLength - 1}
              step={1}
              defaultValue={sliderRangeValues}
              onValueChange={handleSliderChange}
              formatLabel={formatLabel}
              className="w-full"
            />
          </div>
          <Button
            className="mt-2 !h-[26px] !w-[115px] self-start !p-0"
            onClick={() => {
              onGenerate(computeViewMode);
            }}
          >
            Generate
          </Button>
        </div>
      </PanelSection>
    </div>
  );
};

export default DynamicVolumeControls;

function FrameControls({
  isPlaying,
  onPlayPauseChange,
  fps,
  minFps,
  maxFps,
  onFpsChange,
  framesLength,
  onFrameChange,
  currentFrameIndex,
  computedView,
}) {
  const getPlayPauseIconName = () => (isPlaying ? 'icon-pause' : 'icon-play');

  return (
    <div className={computedView && 'ohif-disabled'}>
      <Header
        title="4D Controls"
        tooltip={
          <div>
            Play/Pause Button: Begin or pause the animation of the 4D visualization. <br></br> Frame
            Selector: Navigate through individual frames of the 4D data. <br></br> FPS (Frames Per
            Second) Selector: Adjust the playback speed of the animation.
          </div>
        }
      />
      <div className="mt-3 flex justify-between">
        <IconButton
          className="bg-customblue-30 h-[26px] w-[58px] rounded-[4px]"
          onClick={() => onPlayPauseChange(!isPlaying)}
        >
          <Icons.ByName
            name={getPlayPauseIconName()}
            className="active:text-primary-light hover:bg-customblue-300 h-[24px] w-[24px] cursor-pointer text-white"
          />
        </IconButton>
        <InputNumber
          value={currentFrameIndex}
          onChange={onFrameChange}
          minValue={0}
          maxValue={framesLength - 1}
          label="Frame"
          {...controlClassNames}
        />
        <InputNumber
          value={fps}
          onChange={onFpsChange}
          minValue={minFps}
          maxValue={maxFps}
          {...controlClassNames}
          label="FPS"
        />
      </div>
    </div>
  );
}
