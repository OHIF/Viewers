import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as d3Selection from 'd3-selection';
import * as d3Shape from 'd3-shape';

import chart from './chart';
import events from './events';

const {
  external: { resetZoom },
} = events;

/**
 * @typedef TimecoursePoint It defines a tuple of timecourse value (time X intensity)
 * @type {array}
 * @property {number} 0 indicates x|y value on the pair (x,y)
 * @property {number} 1 indicates x|y value on the pair (x,y)
 */

/**
 * @typedef TimecoursePointDef It defines the shape of a given TimecoursePoint Axis
 * @type {object}
 * @property {string} label label for given TimecoursePoint Axis
 * @property {string} [unit] unit for given TimecoursePoint Axis
 * @property {string} type defines the type of given TimecoursePoint Axis
 * @property {number} indexRef refers the index into given TimecoursePoint for the current Axis Definition
 */

/**
 * It gets max value of an array, considering value of param index
 *
 * @param {TimecoursePoint[]} array array of items to be evaluated
 * @param {number} index index of each array`s item to be evaluated
 * @return {any} max value
 */
function _getMaxValue(array, index) {
  return d3Array.max(array, arrayItem => {
    return arrayItem[index];
  });
}

function _getMinValue(array, index) {
  return d3Array.min(array, arrayItem => {
    return arrayItem[index];
  });
}

const LEGEND = { width: 100, margin: 10 };
const MARGIN = { top: 20, right: 20, bottom: 50, left: 50 };

function _createAxisScale(domainBottom, domainUpper, rangeBottom, rangeUpper) {
  return d3Scale
    .scaleLinear()
    .domain([domainBottom, domainUpper * 1.05])
    .range([rangeBottom, rangeUpper]);
}

const _getSeriesColor = series => {
  const seriesLabels = series.reduce((labels, series) => [...labels, series.label], []);

  return d3Scale.scaleOrdinal().domain(seriesLabels).range(d3ScaleChromatic.schemeSet2);
};

const _updateSeriesColors = series => {
  const seriesColor = _getSeriesColor(series);

  return series.map(series => ({
    ...series,
    color: series.color ?? seriesColor(series.label),
  }));
};

const _textEllipses = (width, padding = 0) => {
  return function (...args) {
    const self = d3Selection.select(this);
    let textLength = self.node().getComputedTextLength();
    let text = self.text();

    while (textLength > width - 2 * padding && text.length > 0) {
      text = text.slice(0, -1);
      self.text(text + '...');
      textLength = self.node().getComputedTextLength();
    }
  };
};

const _addLegend = (root, series, chartWidth, chartHeight, legendWidth) => {
  const legendItemHeight = 25;
  const legendHeight = legendItemHeight * series.length;

  const legendContainer = chart.legend.addNode(
    root,
    legendWidth,
    legendHeight,
    chartWidth + LEGEND.margin,
    chartHeight / 2 - legendHeight / 2
  );

  const seriesLabels = series.reduce((labels, series) => [...labels, series.label], []);

  const seriesColors = series.reduce((colors, series) => [...colors, series.color], []);

  chart.legend.setLabels(
    legendContainer,
    seriesLabels,
    seriesColors,
    legendItemHeight,
    legendWidth,
    _textEllipses
  );
};

/**
 * It creates a svg chart containing lines, dots, axis, labels
 *
 * @param {object} d3SVGRef svg content reference to append chart
 * @param {Object<string, TimecoursePointDef>} axis definition of axis
 * @param {object} points list of points to be created
 * @param {number} width width for whole content including lines, dots, axis, labels
 * @param {number} height height for whole content including lines, dots, axis, labels
 * @param {boolean} showAxisLabels flag to display labels or not
 *
 * @modifies {d3SVGRef}
 */
const addLineChartNode = ({
  d3SVGRef,
  axis,
  series,
  width,
  height,
  legendWidth = LEGEND.width,
  showAxisLabels = true,
  showAxisGrid = false,
  showLegend = false,
  transparentChartBackground = false,
}) => {
  const marginRight = showLegend ? legendWidth + 2 * LEGEND.margin : MARGIN.right;
  const _width = width - MARGIN.left - marginRight;
  const _height = height - MARGIN.top - MARGIN.bottom;
  const { x: XAxis, y: YAxis } = axis;

  series = _updateSeriesColors(series);

  let maxX = -Infinity;
  let minX = Infinity;
  let maxY = -Infinity;
  let minY = Infinity;

  series.forEach(currentSeries => {
    minX = Math.min(minX, _getMinValue(currentSeries.points, XAxis.indexRef));
    maxX = Math.max(maxX, _getMaxValue(currentSeries.points, XAxis.indexRef));
    minY = Math.min(minY, _getMinValue(currentSeries.points, YAxis.indexRef));
    maxY = Math.max(maxY, _getMaxValue(currentSeries.points, YAxis.indexRef));
  });

  minX = axis?.x?.range?.min ?? minX;
  maxX = axis?.x?.range?.max ?? maxX;
  minY = axis?.y?.range?.min ?? minY;
  maxY = axis?.y?.range?.max ?? maxY;

  const xAxisScale = _createAxisScale(minX, maxX, 0, _width);
  const yAxisScale = _createAxisScale(minY, maxY, _height, 0);

  const parseXPoint = axisScale => point => {
    return (axisScale || xAxisScale)(point.x);
  };

  const parseYPoint = axisScale => point => {
    return (axisScale || yAxisScale)(point.y);
  };

  // Remove old D3 elements
  chart.removeContents(d3SVGRef);

  const chartWrapper = chart.container.addNode(d3SVGRef, width, height, MARGIN.left, MARGIN.top);

  // add background
  chart.background.addNode(chartWrapper, _width, _height, transparentChartBackground);

  // call the x axis in a group tag
  const xAxisGenerator = d3Axis.axisBottom(xAxisScale);

  if (showAxisGrid) {
    xAxisGenerator.tickSize(-_height).tickPadding(10);
  }
  const gXAxis = chart.axis.addNode(
    chartWrapper,
    XAxis,
    undefined,
    _height,
    undefined,
    () => xAxisGenerator,
    showAxisLabels,
    _width / 2,
    _height + MARGIN.bottom / 2 + 10,
    undefined,
    showAxisGrid
  );
  const yAxisGenerator = d3Axis.axisLeft(yAxisScale);

  if (showAxisGrid) {
    yAxisGenerator.tickSize(-_width).tickPadding(10);
  }
  // add y axis
  const gYAxis = chart.axis.addNode(
    chartWrapper,
    YAxis,
    undefined,
    undefined,
    undefined,
    () => yAxisGenerator,
    showAxisLabels,
    0 - _height / 2,
    0 - MARGIN.left,
    [
      { key: 'transform', value: 'rotate(-90)' },
      { key: 'dy', value: '1em' },
    ],
    showAxisGrid
  );

  const datasets = [];

  series.forEach((currentSeries, seriesIndex) => {
    const { points } = currentSeries;
    const line = d3Shape.line().x(parseXPoint(xAxisScale)).y(parseYPoint(yAxisScale));

    const dataset = points.map((point, pointIndex) => {
      return { x: point[0], y: point[1], seriesIndex, pointIndex };
    });

    const seriesContainer = chart.series.addNode(chartWrapper, seriesIndex, {
      color: currentSeries.color || '#00ff00',
    });

    chart.lines.addNode(seriesContainer, dataset, line);

    // add chart points
    chart.points.addNode(
      seriesContainer,
      dataset,
      parseXPoint(xAxisScale),
      parseYPoint(yAxisScale)
    );

    datasets.push(dataset);
  });

  if (showLegend) {
    _addLegend(chartWrapper, series, _width, _height, legendWidth);
  }

  // bind events
  events.bindMouseEvents(
    chartWrapper,
    gXAxis,
    gYAxis,
    xAxisScale,
    yAxisScale,
    xAxisGenerator,
    yAxisGenerator,
    parseXPoint,
    parseYPoint,
    datasets
  );

  return chartWrapper;
};

export { addLineChartNode, resetZoom };
