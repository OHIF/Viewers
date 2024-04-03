import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../Icon';
import {
  InputDoubleRange,
  Button,
  PanelSection,
  ButtonGroup,
  IconButton,
  InputNumber,
} from '../../components';

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
}) => {
  return (
    <div className="flex select-none flex-col">
      <PanelSection
        title="Controls"
        childrenClassName="space-y-2"
      >
        <FrameControls
          onPlayPauseChange={onPlayPauseChange}
          isPlaying={isPlaying}
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
          <ViewComponent framesLength={framesLength} />
        </div>
      </PanelSection>
    </div>
  );
};

const ViewComponent = ({ framesLength }) => {
  const [computedView, setComputedView] = useState(false);

  const toggleComputedView = () => {
    setComputedView(prevState => !prevState);
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
            onClick={toggleComputedView}
          >
            4D
          </button>
          <button
            className="w-1/2"
            onClick={toggleComputedView}
          >
            Computed
          </button>
        </ButtonGroup>
      </div>
      <div className="mt-6 flex flex-col">
        <Header title="Operation" />
        <ButtonGroup
          className="mt-2 w-full"
          separated={true}
        >
          <button
            className="w-1/2"
            onClick={toggleComputedView}
          >
            Sum
          </button>
          <button
            className="w-1/2"
            onClick={toggleComputedView}
          >
            Average
          </button>
          <button
            className="w-1/2"
            onClick={toggleComputedView}
          >
            Subtract
          </button>
        </ButtonGroup>
        <div className="w-ful mt-2">
          <InputDoubleRange
            values={[10, 20]}
            onChange={values => console.log(values)}
            minValue={0}
            showLabel={true}
            allowNumberEdit={true}
            maxValue={framesLength}
            step={1}
          />
        </div>
      </div>
      <div>Generate</div>
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
}) {
  const getPlayPauseIconName = () => (isPlaying ? 'icon-pause' : 'icon-play');

  return (
    <div className="mt-3 flex justify-between px-5">
      <IconButton
        className="bg-customblue-30 h-[26px] w-[58px] rounded-[4px]"
        onClick={() => onPlayPauseChange(!isPlaying)}
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
