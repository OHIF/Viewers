import React, { useLayoutEffect, useEffect, useRef, ReactElement } from 'react';
import PropTypes from 'prop-types';
import {
  Range,
  VOIRange,
  Histogram,
  Colormap,
  voiRangePropType,
  rangePropType,
  histogramPropType,
  colormapPropType,
} from './types';

const DEFAULT_COLORMAP = {
  Name: 'Grayscale',
  RGBPoints: [0, 0, 0, 0, 1, 1, 1, 1],
};

const clamp = (value, min, max) => Math.min(Math.max(min, value), max);

const interpolateVec3 = (a, b, t) => {
  return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t];
};

const drawBackground = (canvas, range, voiRange, colormap) => {
  const context = canvas.getContext('2d');
  const { width, height } = canvas;
  const windowWidth = voiRange.max - voiRange.min;
  const rgbPoints = colormap.RGBPoints;
  const colorsCount = rgbPoints.length / 4;

  const getColorPoint = index => {
    const offset = 4 * index;

    return index < colorsCount
      ? {
          index,
          position: rgbPoints[offset],
          color: [rgbPoints[offset + 1], rgbPoints[offset + 2], rgbPoints[offset + 3]],
        }
      : undefined;
  };

  let leftColorPoint = undefined;
  let rightColorPoint = getColorPoint(0);

  const incRawPixelValue = (range.max - range.min) / (width - 1);
  let rawPixelValue = range.min;

  for (let x = 0; x < width; x++) {
    const tVoiRange = (rawPixelValue - voiRange.min) / windowWidth;

    // Find the color in a linear way (O(n) complexity)
    if (rightColorPoint) {
      for (let i = rightColorPoint.index; i < colorsCount; i++) {
        if (tVoiRange <= rightColorPoint.position) {
          break;
        }

        leftColorPoint = rightColorPoint;
        rightColorPoint = getColorPoint(i + 1);
      }
    }

    let normColor;

    if (!leftColorPoint) {
      normColor = [...rightColorPoint.color];
    } else if (!rightColorPoint) {
      normColor = [...leftColorPoint.color];
    } else {
      const tColorRange =
        (tVoiRange - leftColorPoint.position) /
        (rightColorPoint.position - leftColorPoint.position);

      normColor = interpolateVec3(leftColorPoint.color, rightColorPoint.color, tColorRange);
    }

    const color = normColor.map(color => clamp(Math.round(color * 255), 0, 255));

    context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    context.fillRect(x, 0, 1, height);

    rawPixelValue += incRawPixelValue;
  }
};

/* plots the histogram bins as a polygon that traces the centers of each bin */
const drawPolygonHistogram = (canvas, context, histogram, options) => {
  const xScale = canvas.width / histogram.numBins;
  const { scale } = options;
  const maxVal = scale(histogram.maxBinValue);

  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(0, canvas.height - (canvas.height * scale(histogram.bins[0])) / maxVal);

  let x = xScale / 2;
  for (let bin = 0; bin < histogram.numBins; bin++) {
    context.lineTo(x, canvas.height - (canvas.height * scale(histogram.bins[bin])) / maxVal);
    x += xScale;
  }
  context.lineTo(
    canvas.width,
    canvas.height - (canvas.height * scale(histogram.bins[histogram.numBins - 1])) / maxVal
  );
  context.lineTo(canvas.width, canvas.height);
  context.lineTo(0, canvas.height);

  context.closePath();
  context.fill();
  context.stroke();
};

/* plots the histogram bins as a series of n vertical bars (n = number of bins) */
const drawBarHistogram = (canvas, context, histogram, options) => {
  const xScale = canvas.width / histogram.numBins;
  const { scale } = options;
  const maxVal = scale(histogram.maxBinValue);

  context.beginPath();

  for (let bin = 0; bin < histogram.numBins; bin++) {
    context.moveTo(xScale * bin, canvas.height);
    context.lineTo(
      xScale * bin,
      canvas.height - (canvas.height * scale(histogram.bins[bin])) / maxVal
    );
  }

  context.closePath();
  context.strokeStyle = options.fillColor;
  context.lineWidth = xScale;
  context.stroke();
};

const drawHistogram = (canvas, histogram, options) => {
  const context = canvas.getContext('2d');

  // context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.fillColor;
  context.strokeStyle = options.lineColor;

  if (options.style === 'polygon') {
    drawPolygonHistogram(canvas, context, histogram, options);
  } else if (options.style === 'bars') {
    drawBarHistogram(canvas, context, histogram, options);
  } else {
    throw new Error(`Invalid style (${options.style})`);
  }
};

const WindowLevelHistogram = ({
  range,
  voiRange,
  histogram,
  colormap = DEFAULT_COLORMAP,
  style = 'polygon',
  fillColor = '#3f3f3f',
  lineColor = '#707070',
}: {
  range: Range;
  voiRange: VOIRange;
  histogram: Histogram;
  colormap: Colormap;
  style: string;
  fillColor: string;
  lineColor: string;
}): ReactElement => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const minVOIPercent = ((voiRange.min - range.min) / (range.max - range.min)) * 100;
  const maxVoiPercent = (1 - (range.max - voiRange.max) / (range.max - range.min)) * 100;
  const background =
    colormap.Name !== 'Grayscale'
      ? undefined
      : `linear-gradient(to right, #000 0%, #000 ${minVOIPercent}%, #fff ${maxVoiPercent}%, #fff 100%)`;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }, [containerRef, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const fnIdentity = x => x;
    const options = {
      style,
      fillColor,
      lineColor,
      scale: fnIdentity,
    };

    context.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(canvas, range, voiRange, colormap);
    drawHistogram(canvas, histogram, options);
  }, [range, voiRange, histogram, colormap, style, fillColor, lineColor, canvasRef]);

  return (
    <div
      ref={containerRef}
      className="h-full"
      style={{ background }}
    >
      <canvas
        ref={canvasRef}
        width="1"
        height="1"
      ></canvas>
    </div>
  );
};

WindowLevelHistogram.propTypes = {
  range: rangePropType.isRequired,
  voiRange: voiRangePropType.isRequired,
  histogram: histogramPropType.isRequired,
  colormap: colormapPropType,
  style: PropTypes.oneOf(['polygon', 'bars']),
  fillColor: PropTypes.string,
  lineColor: PropTypes.string,
};

export default WindowLevelHistogram;
