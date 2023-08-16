import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  ReactElement,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import WindowLevelSlider from './WindowLevelSlider';
import WindowLevelHistogram from './WindowLevelHistogram';
import InputRange from '../InputRange';
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
  title,
  step,
  histogram,
  voi: voiProp,
  opacity: opacityProp,
  showOpacitySlider,
  colormap,
  style,
  fillColor,
  lineColor,
  containerClassName,
  onVOIChange,
  onOpacityChange,
}: {
  title: string;
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
    voiRange => {
      const windowWidth = voiRange.max - voiRange.min;
      const windowCenter = voiRange.min + windowWidth / 2;

      setVOIRange(voiRange);

      if (onVOIChange) {
        onVOIChange({ windowWidth, windowCenter });
      }
    },
    [onVOIChange]
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
    <div
      className={classnames(
        'maxValue-w-sm p-0.5 text-white text-[0px] bg-secondary-dark',
        containerClassName
      )}
    >
      {/* <div className="p-1 text-base text-center">Window Level</div> */}
      <div className="px-2 pt-0 pb-2">
        <fieldset className="border border-solid border-primary-main">
          <legend className="text-white text-base"> {title}</legend>
          <div className="p-1">
            <div className="flex h-4">
              <div className="grow h-fit relative">
                <span className="absolute text-base leading-3 left-0 bottom-px">
                  {range.min}
                </span>
              </div>
              <div className="grow h-fit relative text-right">
                <span className="absolute text-base leading-3 right-0 bottom-px">
                  {range.max}
                </span>
              </div>
            </div>
            <div className="px-4 pb-2.5">
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
                <WindowLevelSlider
                  step={step}
                  range={range}
                  voiRange={voiRange}
                  onVOIRangeChange={handleVOIRangeChange}
                />
              </div>
            </div>
            {showOpacitySlider && (
              <div className="text-base py-4 px-4">
                <InputRange
                  inputClassName="grow"
                  showLabel={false}
                  maxValue={1}
                  minValue={0}
                  step={0.001}
                  value={opacity}
                  onChange={handleOpacityChange}
                />
              </div>
            )}
          </div>
        </fieldset>
      </div>
    </div>
  );
};

WindowLevel.defaultProps = {
  title: 'Window Level',
  step: 1,
  opacity: 1,
  showOpacitySlider: false,
  style: 'polygon',
  fillColor: '#3f3f3f',
  lineColor: '#707070',
};

WindowLevel.propTypes = {
  title: PropTypes.string,
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
