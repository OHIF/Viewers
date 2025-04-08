import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import { Icons } from '@ohif/ui-next';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { Button } from '../Button/Button';
import { Numeric } from '../Numeric/Numeric';
// import './CinePlayer.css';

export type CinePlayerProps = {
  className: string;
  isPlaying: boolean;
  minFrameRate?: number;
  maxFrameRate?: number;
  stepFrameRate?: number;
  frameRate?: number;
  onFrameRateChange: (value: number) => void;
  onPlayPauseChange: (value: boolean) => void;
  onClose: () => void;
  updateDynamicInfo?: (info: any) => void;
  dynamicInfo?: {
    dimensionGroupNumber: number;
    numDimensionGroups: number;
    label?: string;
  };
};

const CinePlayer: React.FC<CinePlayerProps> = ({
  className,
  isPlaying = false,
  minFrameRate = 1,
  maxFrameRate = 90,
  stepFrameRate = 1,
  frameRate: defaultFrameRate = 24,
  onFrameRateChange = () => {},
  onPlayPauseChange = () => {},
  onClose = () => {},
  dynamicInfo = {},
  updateDynamicInfo,
}) => {
  const isDynamic = !!dynamicInfo?.numDimensionGroups;
  const [frameRate, setFrameRate] = useState(defaultFrameRate);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const debouncedSetFrameRate = useCallback(debounce(onFrameRateChange, 100), [onFrameRateChange]);

  const getPlayPauseIconName = () => (isPlaying ? 'icon-pause' : 'icon-play');

  const handleSetFrameRate = (frameRate: number) => {
    if (frameRate < minFrameRate || frameRate > maxFrameRate) {
      return;
    }
    setFrameRate(frameRate);
    debouncedSetFrameRate(frameRate);
  };

  useEffect(() => {
    setFrameRate(defaultFrameRate);
  }, [defaultFrameRate]);

  const handleDimensionGroupNumberChange = useCallback(
    (newGroupNumber: number) => {
      if (isDynamic && dynamicInfo) {
        updateDynamicInfo?.({
          ...dynamicInfo,
          dimensionGroupNumber: newGroupNumber,
        });
      }
    },
    [isDynamic, dynamicInfo, updateDynamicInfo]
  );

  return (
    <div className={className}>
      {isDynamic && dynamicInfo && (
        <Numeric.Container
          mode="singleRange"
          min={1}
          max={dynamicInfo.numDimensionGroups}
          step={1}
          value={dynamicInfo.dimensionGroupNumber}
          onChange={val => handleDimensionGroupNumberChange(val as number)}
          className="mb-3 w-full"
        >
          <Numeric.SingleRange showNumberInput={false} />
        </Numeric.Container>
      )}
      <div
        className={
          'border-secondary-light/60 bg-primary-dark inline-flex select-none items-center gap-2 rounded border px-2 py-2'
        }
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPlayPauseChange(!isPlaying)}
          data-cy={'cine-player-play-pause'}
          className="hover:bg-customblue-300 active:text-primary-light text-white hover:rounded"
        >
          <Icons.ByName name={getPlayPauseIconName()} />
        </Button>

        {isDynamic && dynamicInfo && (
          <div className="min-w-16 max-w-44 flex flex-col text-white">
            <div className="text-[11px]">
              <span className="w-2 text-white">{dynamicInfo.dimensionGroupNumber}</span>{' '}
              <span className="text-aqua-pale">{`/${dynamicInfo.numDimensionGroups}`}</span>
            </div>
            <div className="text-aqua-pale text-xs">{dynamicInfo.label}</div>
          </div>
        )}

        <div className="border-secondary-light ml-4 flex h-6 items-stretch gap-1 rounded">
          <Popover
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-full border-none bg-transparent p-0 hover:bg-transparent"
              >
                <Numeric.Container
                  mode="stepper"
                  min={minFrameRate}
                  max={maxFrameRate}
                  step={stepFrameRate}
                  value={frameRate}
                  onChange={val => handleSetFrameRate(val as number)}
                  className="border-0 bg-transparent"
                >
                  <Numeric.NumberStepper
                    direction="horizontal"
                    inputWidth="w-7 max-w-7"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex-shrink-0 text-center text-sm leading-[22px] text-white">
                        <span className="text-aqua-pale whitespace-nowrap text-xs">{' FPS'}</span>
                      </div>
                    </div>
                  </Numeric.NumberStepper>
                </Numeric.Container>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              className="cine-fps-range-popover z-50 w-auto p-2"
              sideOffset={8}
            >
              <Numeric.Container
                mode="singleRange"
                min={minFrameRate}
                max={maxFrameRate}
                step={stepFrameRate}
                value={frameRate}
                onChange={val => handleSetFrameRate(val as number)}
                className="h-9 px-2"
              >
                <Numeric.SingleRange
                  showNumberInput={false}
                  sliderClassName="w-40"
                />
              </Numeric.Container>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-cy={'cine-player-close'}
          className="text-primary-active hover:bg-customblue-300 active:text-primary-light hover:rounded"
        >
          <Icons.Close />
        </Button>
      </div>
    </div>
  );
};

CinePlayer.propTypes = {
  /** Minimum value for range slider */
  minFrameRate: PropTypes.number,
  /** Maximum value for range slider */
  maxFrameRate: PropTypes.number,
  /** Increment range slider can "step" in either direction */
  stepFrameRate: PropTypes.number,
  frameRate: PropTypes.number,
  /** 'true' if playing, 'false' if paused */
  isPlaying: PropTypes.bool.isRequired,
  onPlayPauseChange: PropTypes.func,
  onFrameRateChange: PropTypes.func,
  onClose: PropTypes.func,
  isDynamic: PropTypes.bool,
  dynamicInfo: PropTypes.shape({
    dimensionGroupNumber: PropTypes.number,
    numDimensionGroups: PropTypes.number,
    label: PropTypes.string,
  }),
};

export default CinePlayer;
