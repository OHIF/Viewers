import React, { useState } from 'react';
import { Button, PanelSection, ButtonGroup, IconButton } from '@ohif/ui';
import { Icons, Tooltip, TooltipTrigger, TooltipContent, Numeric, InputNumber } from '@ohif/ui-next';

// Define fallback values that don't rely on cornerstone enums
const DYNAMIC_OPERATOR_TYPES = {
  SUM: 'sum',
  AVERAGE: 'average',
  SUBTRACT: 'subtract'
};

// Helper function to safely convert any value to uppercase string
const toUpperCaseString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).toUpperCase();
};

const controlClassNames = {
  sizeClassName: 'w-[58px] h-[28px]',
  arrowsDirection: 'horizontal',
  labelPosition: 'bottom',
};

const Header = ({ title, tooltip }) => (
  <div className="flex items-center space-x-1">
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Icons.ByName
            name="info-link"
            className="text-primary-active h-[14px] w-[14px]"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={4}
        className="bg-primary-dark max-w-xs p-2 text-white"
      >
        <div>{tooltip}</div>
      </TooltipContent>
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
  currentDimensionGroupNumber,
  onDimensionGroupChange,
  numDimensionGroups,
  onGenerate,
  onDoubleRangeChange,
  rangeValues,
  onDynamicClick,
}) => {
  const [computedView, setComputedView] = useState(false);
  const [computeViewMode, setComputeViewMode] = useState(DYNAMIC_OPERATOR_TYPES.SUM);

  // Wrapper for onGenerate to handle potential errors
  const handleGenerate = () => {
    try {
      if (typeof onGenerate === 'function') {
        onGenerate(computeViewMode);
      } else {
        console.error('onGenerate is not a function', onGenerate);
      }
    } catch (error) {
      console.error('Error in onGenerate:', error);
    }
  };

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
                if (typeof onDynamicClick === 'function') {
                  onDynamicClick();
                }
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
          <DimensionGroupControls
            onPlayPauseChange={onPlayPauseChange}
            isPlaying={isPlaying}
            computedView={computedView}
            // fps
            fps={fps}
            onFpsChange={onFpsChange}
            minFps={minFps}
            maxFps={maxFps}
            //
            numDimensionGroups={numDimensionGroups}
            onDimensionGroupChange={onDimensionGroupChange}
            currentDimensionGroupNumber={currentDimensionGroupNumber}
          />
        </div>
        <div className={`mt-6 flex flex-col ${computedView ? '' : 'ohif-disabled'}`}>
          <Header
            title="Computed Operation"
            tooltip={
              <div>
                Operation Buttons (SUM, AVERAGE, SUBTRACT): Select the mathematical operation to be
                applied to the data set.
                <br /> Range Slider: Choose the numeric range of dimension groups within which the
                operation will be performed.
                <br />
                Generate Button: Execute the chosen operation on the specified range of data.
              </div>
            }
          />
          <ButtonGroup
            className="mt-2 w-full"
            separated={true}
          >
            <button
              className="w-1/2"
              onClick={() => setComputeViewMode(DYNAMIC_OPERATOR_TYPES.SUM)}
            >
              {toUpperCaseString(DYNAMIC_OPERATOR_TYPES.SUM)}
            </button>
            <button
              className="w-1/2"
              onClick={() => setComputeViewMode(DYNAMIC_OPERATOR_TYPES.AVERAGE)}
            >
              {toUpperCaseString(DYNAMIC_OPERATOR_TYPES.AVERAGE)}
            </button>
            <button
              className="w-1/2"
              onClick={() => setComputeViewMode(DYNAMIC_OPERATOR_TYPES.SUBTRACT)}
            >
              {toUpperCaseString(DYNAMIC_OPERATOR_TYPES.SUBTRACT)}
            </button>
          </ButtonGroup>
          <div className="mt-2 w-full">
            <Numeric.Container
              mode="doubleRange"
              min={1}
              max={numDimensionGroups || 1}
              values={rangeValues || [1, numDimensionGroups || 1]}
              onChange={onDoubleRangeChange || (() => {})}
            >
              <Numeric.DoubleRange showNumberInputs />
            </Numeric.Container>
          </div>
          <Button
            className="mt-2 !h-[26px] !w-[115px] self-start !p-0"
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </div>
      </PanelSection>
    </div>
  );
};

export default DynamicVolumeControls;

function DimensionGroupControls({
  isPlaying,
  onPlayPauseChange,
  fps,
  minFps,
  maxFps,
  onFpsChange,
  numDimensionGroups,
  onDimensionGroupChange,
  currentDimensionGroupNumber,
  computedView,
}) {
  const getPlayPauseIconName = () => (isPlaying ? 'icon-pause' : 'icon-play');

  return (
    <div className={computedView ? 'ohif-disabled' : ''}>
      <Header
        title="4D Controls"
        tooltip={
          <div>
            Play/Pause Button: Begin or pause the animation of the 4D visualization. <br />
            Dimension Group Selector: Navigate through individual dimension groups of the 4D data.{' '}
            <br />
            FPS (Frames Per Second) Selector: Adjust the playback speed of the animation.
          </div>
        }
      />
      <div className="mt-3 flex justify-between">
        <IconButton
          id="play-pause-button"
          className="bg-customblue-30 h-[26px] w-[58px] rounded-[4px]"
          onClick={() => {
            if (typeof onPlayPauseChange === 'function') {
              onPlayPauseChange(!isPlaying);
            }
          }}
        >
          <Icons.ByName
            name={getPlayPauseIconName()}
            className="active:text-primary-light hover:bg-customblue-300 h-[24px] w-[24px] cursor-pointer text-white"
          />
        </IconButton>
        <InputNumber
          value={currentDimensionGroupNumber || 1}
          onChange={onDimensionGroupChange || (() => {})}
          min={1}
          max={numDimensionGroups || 1}
          arrowsDirection="horizontal"
          className="flex-col"
        >
          <InputNumber.Container sizeClassName="w-[58px] h-[28px]">
            <InputNumber.HorizontalControls>
              <InputNumber.Input className="text-white" />
            </InputNumber.HorizontalControls>
          </InputNumber.Container>
          <InputNumber.Label position="bottom">Group</InputNumber.Label>
        </InputNumber>

        <InputNumber
          value={fps || 1}
          onChange={onFpsChange || (() => {})}
          min={minFps || 1}
          max={maxFps || 30}
          arrowsDirection="horizontal"
          className="flex-col"
        >
          <InputNumber.Container sizeClassName="w-[58px] h-[28px]">
            <InputNumber.HorizontalControls>
              <InputNumber.Input className="text-white" />
            </InputNumber.HorizontalControls>
          </InputNumber.Container>
          <InputNumber.Label position="bottom">FPS</InputNumber.Label>
        </InputNumber>
      </div>
    </div>
  );
}