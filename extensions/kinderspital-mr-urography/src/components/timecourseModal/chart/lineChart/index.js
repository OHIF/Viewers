import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';

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
  return max(array, arrayItem => {
    return arrayItem[index];
  });
}
// margin convention practice
const MARGIN = { top: 20, right: 50, bottom: 50, left: 50 };

/**
 * It creates a svg chart containing lines, dots, axis, labels
 *
 * @param {object} d3SVGRef svg content reference to append chart
 * @param {function} movingPointsCallback callback method to be called once p/g points are changed
 * @param {Object<string, TimecoursePointDef>} axis definition of axis
 * @param {object} points list of points to be created
 * @param {number} [peekIndex] index related to peek point
 * @param {number} [glomerularIndex] index related to peek point
 * @param {number} defaultTimecourseInterval interval for adding new p/g point
 * @param {number} width width for whole content including lines, dots, axis, labels
 * @param {number} height height for whole content including lines, dots, axis, labels
 * @param {boolean} showAxisLabels flag to display labels or not
 *
 * @modifies {d3SVGRef}
 */
const addLineChartNode = (
  d3SVGRef,
  movingPointsCallback,
  axis,
  points = [],
  peekIndex,
  glomerularIndex,
  width,
  height,
  showAxisLabels = true,
  showAxisGrid = false,
  transparentChartBackground = false
) => {
  const _width = width - MARGIN.left - MARGIN.right;
  const _height = height - MARGIN.top - MARGIN.bottom;

  const { x: XAxis, y: YAxis } = axis;

  function createAxisScale(domainBottom, domainUpper, rangeBottom, rangeUpper) {
    return scaleLinear()
      .domain([domainBottom, domainUpper * 1.05])
      .range([rangeBottom, rangeUpper]);
  }

  const maxX = _getMaxValue(points, XAxis.indexRef);
  const maxY = _getMaxValue(points, YAxis.indexRef);

  if (!maxX || !maxY) {
    return;
  }

  const xAxisScale = createAxisScale(0, maxX, 0, _width);
  const yAxisScale = createAxisScale(0, maxY, _height, 0);

  const parseXPoint = axisScale => (point, index) => {
    return (axisScale || xAxisScale)(points[index][XAxis.indexRef]);
  };

  const parseYPoint = axisScale => point => {
    return (axisScale || yAxisScale)(point.y);
  };

  // create line
  const _line = line()
    .x(parseXPoint(xAxisScale))
    .y(parseYPoint(yAxisScale));

  const dataset = points.map(point => {
    return { y: point[YAxis.indexRef] };
  });

  // Remove old D3 elements
  chart.removeContents(d3SVGRef);

  const chartWrapper = chart.container.addNode(
    d3SVGRef,
    _width + MARGIN.left + MARGIN.right,
    _height + MARGIN.top + MARGIN.bottom,
    MARGIN.left,
    MARGIN.top
  );

  // add background
  chart.background.addNode(
    chartWrapper,
    _width,
    _height,
    transparentChartBackground
  );
  // call the x axis in a group tag
  const xAxisGenerator = axisBottom(xAxisScale);

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
  const yAxisGenerator = axisLeft(yAxisScale);

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
  // add line chart
  chart.lines.addNode(chartWrapper, dataset, _line);
  // add chart points
  const gDots = chart.points.addNode(
    chartWrapper,
    dataset,
    parseXPoint(xAxisScale),
    parseYPoint(yAxisScale)
  );

  if (peekIndex >= 0 && glomerularIndex >= 0) {
    const gDotsNodes = gDots.nodes();
    const gPeekPoint = gDotsNodes[peekIndex];
    const gGlomerularPoint = gDotsNodes[glomerularIndex];

    const _interactionDataset = chart.interactionPoint.buildDataset(
      gPeekPoint,
      peekIndex,
      gGlomerularPoint,
      glomerularIndex,
      parseXPoint,
      parseYPoint,
      xAxisScale,
      yAxisScale
    );

    // create line
    const _interactionLine = line()
      .x(chart.interactionPoint.parseXPoint(parseXPoint, xAxisScale))
      .y(chart.interactionPoint.parseYPoint(parseYPoint, yAxisScale));
    // set interaction points
    chart.interactionPoint.addNode(
      chartWrapper,
      gPeekPoint,
      gGlomerularPoint,
      _interactionDataset,
      _interactionLine
    );
  }

  // bind events
  events.bindMouseEvents(
    chartWrapper,
    points,
    gXAxis,
    gYAxis,
    xAxisScale,
    yAxisScale,
    xAxisGenerator,
    yAxisGenerator,
    parseXPoint,
    parseYPoint,
    dataset,
    peekIndex,
    glomerularIndex,
    movingPointsCallback
  );

  return chartWrapper;
};

const defaultTimecourseInterval = value => {
  return chart.interactionPoint.defaultInterval(value);
};

export { addLineChartNode, resetZoom, defaultTimecourseInterval };
