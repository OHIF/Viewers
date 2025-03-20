import React, { useEffect, useState, useMemo } from 'react';
import { Numeric } from '../Numeric/Numeric';
import WindowLevelHistogram from './WindowLevelHistogram';
import { VOI, VOIRange, Histogram, Colormap } from './types';

interface WindowLevelProps {
  title?: string;
  step?: number;
  histogram: Histogram;
  voi: VOI;
  opacity?: number;
  showOpacitySlider?: boolean;
  colormap?: Colormap;
  style?: 'polygon' | 'bars';
  fillColor?: string;
  lineColor?: string;
  containerClassName?: string;
  onVOIChange?: (voi: VOI) => void;
  onOpacityChange?: (opacity: number) => void;
}

const convertVOItoVOIRange = (voi: VOI): VOIRange => {
  return {
    min: voi.windowCenter - voi.windowWidth / 2,
    max: voi.windowCenter + voi.windowWidth / 2,
  };
};

const WindowLevel = ({
  title,
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
}: WindowLevelProps) => {
  // Define range from histogram
  const range = useMemo(
    () => ({
      min: histogram.range.min,
      max: histogram.range.max,
    }),
    [histogram]
  );

  // Initialize VOI range from props
  const [voiRange, setVOIRange] = useState<VOIRange>(
    voiProp
      ? convertVOItoVOIRange(voiProp)
      : {
          min: range.min,
          max: range.max,
        }
  );

  // Update VOI range when props change
  useEffect(() => {
    if (voiProp) {
      setVOIRange(convertVOItoVOIRange(voiProp));
    }
  }, [voiProp]);

  // Handle VOI range changes (from slider)
  const handleVOIRangeChange = (newValues: [number, number]) => {
    const [min, max] = newValues;
    if (min === voiRange.min && max === voiRange.max) {
      return;
    }

    const windowWidth = max - min;
    const windowCenter = min + windowWidth / 2;

    setVOIRange({
      min,
      max,
    });

    if (onVOIChange) {
      onVOIChange({ windowWidth, windowCenter });
    }
  };

  // Handle opacity changes
  const handleOpacityChange = (value: number) => {
    if (onOpacityChange) {
      onOpacityChange(value);
    }
  };

  return (
    <div className={`text-foreground max-w-sm p-1 ${containerClassName || ''}`}>
      {title && <div className="text-muted-foreground mb-1 text-sm">{title}</div>}

      <div className="space-y-2 px-2">
        {/* Range Labels */}
        <div className="text-muted-foreground flex h-4 text-sm">
          <div className="relative h-fit grow">
            <span className="absolute left-0 bottom-px leading-3">{range.min}</span>
          </div>
          <div className="relative h-fit grow text-right">
            <span className="absolute right-0 bottom-px leading-3">{range.max}</span>
          </div>
        </div>

        {/* Histogram Visualization */}
        <div className="bg-foreground h-11">
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

        {/* Window Level Range Slider */}
        <Numeric.Container
          mode="doubleRange"
          min={range.min}
          max={range.max}
          values={[voiRange.min, voiRange.max]}
          step={step}
          onChange={values => handleVOIRangeChange(values as [number, number])}
        >
          <Numeric.DoubleRange showNumberInputs />
        </Numeric.Container>

        {/* Opacity Slider (optional) */}
        {showOpacitySlider && (
          <div className="mt-2">
            <div className="flex items-center justify-between gap-2 text-base">
              <div className="text-xs text-white">Opacity</div>
              <div className="flex-1">
                <Numeric.Container
                  mode="singleRange"
                  min={0}
                  max={1}
                  step={0.05}
                  value={opacityProp}
                  onChange={value => handleOpacityChange(value as number)}
                >
                  <Numeric.SingleRange showNumberInput />
                </Numeric.Container>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WindowLevel;
