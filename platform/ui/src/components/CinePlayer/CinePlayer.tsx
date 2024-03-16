import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import Icon from '../Icon';
import Tooltip from '../Tooltip';
import InputRange from '../InputRange';

import './CinePlayer.css';
import classNames from 'classnames';

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
};

const fpsButtonClassNames =
  'cursor-pointer text-primary-active active:text-primary-light hover:bg-customblue-300 w-4 flex items-center justify-center';

const CinePlayer: React.FC<CinePlayerProps> = ({
  className,
  isPlaying,
  minFrameRate,
  maxFrameRate,
  stepFrameRate,
  frameRate: defaultFrameRate,
  onFrameRateChange,
  onPlayPauseChange,
  onClose,
}) => {
  const [frameRate, setFrameRate] = useState(defaultFrameRate);
  const debouncedSetFrameRate = debounce(onFrameRateChange, 300);

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

  return (
    <div
      className={classNames(
        className,
        'border-secondary-light/60 bg-primary-dark flex select-none items-center gap-2 rounded border px-2 py-2'
      )}
    >
      <Icon
        name={getPlayPauseIconName()}
        className="active:text-primary-light hover:bg-customblue-300 cursor-pointer text-white hover:rounded"
        onClick={() => onPlayPauseChange(!isPlaying)}
      />
      <Tooltip
        position="top"
        className="group/fps cine-fps-range-tooltip"
        tight={true}
        content={
          <InputRange
            containerClassName="h-9 px-2"
            inputClassName="w-40"
            value={frameRate}
            minValue={minFrameRate}
            maxValue={maxFrameRate}
            step={stepFrameRate}
            onChange={handleSetFrameRate}
            showLabel={false}
          />
        }
      >
        <div className="border-secondary-light flex h-6 items-stretch gap-1 rounded border">
          <div
            className={`${fpsButtonClassNames} rounded-l`}
            onClick={() => handleSetFrameRate(frameRate - 1)}
          >
            <Icon name="arrow-left-small" />
          </div>
          <div className="group-hover/fps:text-primary-light w-11 text-center text-sm leading-[22px] text-white">
            {`${frameRate} FPS`}
          </div>
          <div
            className={`${fpsButtonClassNames} rounded-r`}
            onClick={() => handleSetFrameRate(frameRate + 1)}
          >
            <Icon name="arrow-right-small" />
          </div>
        </div>
      </Tooltip>
      <Icon
        name="icon-close"
        className="text-primary-active active:text-primary-light hover:bg-customblue-300 cursor-pointer hover:rounded"
        onClick={onClose}
      />
    </div>
  );
};

const noop = () => {};

CinePlayer.defaultProps = {
  isPlaying: false,
  minFrameRate: 1,
  maxFrameRate: 90,
  stepFrameRate: 1,
  frameRate: 24,
  onPlayPauseChange: noop,
  onFrameRateChange: noop,
  onClose: noop,
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
};

export default CinePlayer;
