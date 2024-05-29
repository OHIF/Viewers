import React, { useEffect, useCallback, useState, useMemo, ReactElement } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import WindowLevelHistogram from './WindowLevelHistogram';
import InputRange from '../InputRange';
import InputDoubleRange from '../InputDoubleRange';
import {
  VOI,
  Colormap,
  Histogram,
  voiPropType,
  histogramPropType,
  colormapPropType,
} from './types';

const convertVOItoVOIRange = voi => {
  return {
    min: voi.windowCenter - voi.windowWidth / 2,
    max: voi.windowCenter + voi.windowWidth / 2,
  };
};

const WindowLevel = ({
  step = 1,
  histogram,
  voi: voiProp,
  opacity: opacityProp = 1,
  showOpacitySlider = false,
  colormap,
  style = 'polygon',
  fillColor = '#3f3f3f',
  lineColor = '#707070',
  containerClassName,
  onVOIChange,
  onOpacityChange,
}: {
  step: number;
  histogram: Histogram;
  voi: VOI;
  opacity: number;
  showOpacitySlider: boolean;
  colormap: Colormap;
  style: string;
  fillColor: string;
  lineColor: string;
  containerClassName: string;
  onVOIChange: (voi: VOI) => void;
  onOpacityChange: (opacity: number) => void;
}): ReactElement => {
  const [opacity, setOpacity] = useState(opacityProp);

  const range = useMemo(
    () => ({
      min: histogram.range.min,
      max: histogram.range.max,
    }),
    [histogram]
  );

  const [voiRange, setVOIRange] = useState(
    voiProp
      ? convertVOItoVOIRange(voiProp)
      : {
          min: range.min,
          max: range.max,
        }
  );

  const handleVOIRangeChange = useCallback(
    newRange => {
      if (newRange[0] === voiRange.min && newRange[1] === voiRange.max) {
        return;
      }

      const windowWidth = newRange[1] - newRange[0];
      const windowCenter = newRange[0] + windowWidth / 2;

      setVOIRange({
        min: newRange[0],
        max: newRange[1],
      });

      if (onVOIChange) {
        onVOIChange({ windowWidth, windowCenter });
      }
    },
    [onVOIChange, voiRange]
  );

  const handleOpacityChange = useCallback(
    value => {
      if (onOpacityChange) {
        onOpacityChange(value);
      }
    },
    [onOpacityChange]
  );

  useEffect(() => setVOIRange(convertVOItoVOIRange(voiProp)), [voiProp]);

  useEffect(() => setOpacity(opacityProp), [opacityProp]);
  return (
    <div className={classnames('maxValue-w-sm p-0.5 text-[0px] text-white', containerClassName)}>
      <div className="px-2 pt-0 pb-[0.5]">
        <div className="flex h-4 text-xs">
          <div className="relative h-fit grow">
            <span className="absolute left-0 bottom-px leading-3">{range.min}</span>
          </div>
          <div className="relative h-fit grow text-right">
            <span className="absolute right-0 bottom-px leading-3">{range.max}</span>
          </div>
        </div>
        <div className="p-1">
          <div className="pb-2.5">
            <div className="h-11 bg-white">
              <WindowLevelHistogram
                range={range}
                voiRange={voiRange}
                histogram={histogram}
                colormap={colormap}
                style={style}
                fillColor={fillColor}
                lineColor={lineColor}
              />
            </div>
            <div>
              <InputDoubleRange
                values={[voiRange.min, voiRange.max]}
                onChange={handleVOIRangeChange}
                minValue={range.min}
                maxValue={range.max}
                allowNumberEdit={true}
                showLabel={true}
                step={step}
                allowOutOfRange={true}
              />
            </div>
          </div>
          {showOpacitySlider && (
            <div className="flex items-center justify-between gap-2 text-base">
              <div className="text-xs text-white">Opacity</div>
              <InputRange
                inputClassName="grow"
                maxValue={1}
                minValue={0}
                step={0.1}
                value={opacity}
                showLabel={true}
                allowNumberEdit={true}
                onChange={handleOpacityChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

WindowLevel.propTypes = {
  step: PropTypes.number,
  histogram: histogramPropType.isRequired,
  voi: voiPropType,
  opacity: PropTypes.number,
  showOpacitySlider: PropTypes.bool,
  colormap: colormapPropType,
  style: PropTypes.oneOf(['polygon', 'bars']),
  fillColor: PropTypes.string,
  lineColor: PropTypes.string,
  containerClassName: PropTypes.string,
  onVOIChange: PropTypes.func,
  onOpacityChange: PropTypes.func,
};

export default WindowLevel;
