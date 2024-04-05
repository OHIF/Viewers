import React, { useEffect, useState } from 'react';
import {
  InputDoubleRange,
  Button,
  PanelSection,
  ButtonGroup,
  IconButton,
  InputNumber,
  Icon,
} from '@ohif/ui';

import { Enums } from '@cornerstonejs/core';

const controlClassNames = {
  sizeClassName: 'w-[58px] h-[28px]',
  arrowsDirection: 'horizontal',
  labelPosition: 'bottom',
};

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

  return (
    <div className="flex select-none flex-col">
      <PanelSection
        title="Controls"
        childrenClassName="space-y-2 pb-5"
      >
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
        <div className="h-[1px] bg-black"></div>
        <div className="px-5">
          <ViewComponent
            framesLength={framesLength}
            setComputedView={setComputedView}
            computedView={computedView}
            onGenerate={onGenerate}
            onDoubleRangeChange={onDoubleRangeChange}
            onDynamicClick={onDynamicClick}
          />
        </div>
      </PanelSection>
    </div>
  );
};

const ViewComponent = ({
  framesLength,
  onGenerate,
  onDoubleRangeChange,
  computedView,
  setComputedView,
  onDynamicClick,
}) => {
  const [computeViewMode, setComputeViewMode] = useState(Enums.DynamicOperatorType.SUM);

  const [sliderRangeValues, setSliderRangeValues] = useState([framesLength / 4, framesLength / 2]);

  useEffect(() => {
    setSliderRangeValues([framesLength / 4, framesLength / 2]);
  }, [framesLength]);

  const handleSliderChange = newValues => {
    onDoubleRangeChange(newValues);

    if (newValues[0] === sliderRangeValues[0] && newValues[1] === sliderRangeValues[1]) {
      return;
    }
    setSliderRangeValues(newValues);
  };

  const Header = ({ title }) => (
    <div className="flex items-center space-x-1">
      <Icon
        name="info-link"
        className="text-primary-active h-[14px] w-[14px]"
      />
      <span className="text-aqua-pale text-[11px] uppercase">{title}</span>
    </div>
  );

  return (
    <div>
      <div>
        <Header title="View" />
        <ButtonGroup className="mt-2 w-full">
          <button
            className="w-1/2"
            onClick={() => {
              setComputedView(false);
              onDynamicClick();
            }}
          >
            4D
          </button>
          <button
            className="w-1/2"
            onClick={() => setComputedView(true)}
          >
            Computed
          </button>
        </ButtonGroup>
      </div>
      <div className={`mt-6 flex flex-col ${computedView ? '' : 'ohif-disabled'}`}>
        <Header title="Operation" />
        <ButtonGroup
          className={`mt-2 w-full `}
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
        <div className="w-ful mt-2">
          <InputDoubleRange
            values={sliderRangeValues}
            onChange={handleSliderChange}
            minValue={0}
            showLabel={true}
            allowNumberEdit={true}
            maxValue={framesLength}
            step={1}
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
    <div className="mt-3 flex justify-between px-5">
      <IconButton
        className="bg-customblue-30 h-[26px] w-[58px] rounded-[4px]"
        onClick={() => onPlayPauseChange(!isPlaying)}
        disabled={computedView}
      >
        <Icon
          name={getPlayPauseIconName()}
          className=" active:text-primary-light hover:bg-customblue-300 h-[24px] w-[24px] cursor-pointer text-white"
        />
      </IconButton>
      <InputNumber
        value={currentFrameIndex}
        onChange={onFrameChange}
        minValue={0}
        maxValue={framesLength}
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
  );
}
