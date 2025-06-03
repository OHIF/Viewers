import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import { Icons } from '@ohif/ui-next';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { Button } from '../Button/Button';
import { Numeric } from '../Numeric/Numeric';

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
    <div
      className={`pointer-events-none absolute top-10 left-1/2 z-50 -translate-x-1/2 ${className}`}
    >
      <div
        className={
          'bg-muted pointer-events-auto inline-flex select-none items-center gap-2 rounded-md px-2 py-2'
        }
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPlayPauseChange(!isPlaying)}
          data-cy={'cine-player-play-pause'}
        >
          <Icons.ByName name={getPlayPauseIconName()} />
        </Button>

        {isDynamic && dynamicInfo && (
          <div className="min-w-16 max-w-44 text-foreground flex flex-col">
            <div className="text-xs">
              <span className="text-foreground w-2">{dynamicInfo.dimensionGroupNumber}</span>{' '}
              <span className="text-muted-foreground">{`/${dynamicInfo.numDimensionGroups}`}</span>
            </div>
            <div className="text-muted-foreground text-xs">{dynamicInfo.label}</div>
          </div>
        )}

        <div>
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
                      <div className="text-foreground flex-shrink-0 text-center text-sm leading-[22px]">
                        <span className="text-muted-foreground whitespace-nowrap text-xs">
                          {' FPS'}
                        </span>
                      </div>
                    </div>
                  </Numeric.NumberStepper>
                </Numeric.Container>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
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
                className="h-6 px-2"
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
        >
          <Icons.Close />
        </Button>
      </div>

      {isDynamic && dynamicInfo && (
        <Numeric.Container
          mode="singleRange"
          min={1}
          max={dynamicInfo.numDimensionGroups}
          step={1}
          value={dynamicInfo.dimensionGroupNumber}
          onChange={val => handleDimensionGroupNumberChange(val as number)}
          className="pointer-events-auto mt-3 w-full"
        >
          <Numeric.SingleRange showNumberInput={false} />
        </Numeric.Container>
      )}
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
