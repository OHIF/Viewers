import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';

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
 * It formats axis labels. It adds units if existing
 *
 * @param {Object} def
 * @param {string} def.label string representing axis label
 * @param {string} [def.unit] string representing axis unit
 * @return {string} formatted label
 */
const _formatAxisLabel = ({ label, unit }) => {
  let formattedLabel = label;

  if (!!unit) {
    formattedLabel += `(${unit})`;
  }

  return formattedLabel;
};

/**
 * It removes children nodes from root param.
 * It mutates passed param
 * @param {object} root svg element to remove children content
 */
const _removeChartContents = root => {
  root.selectAll('*').remove();
};

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

/**
 * It appends chart container graphic to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {number} width width of container
 * @param {number} height height of container
 * @param {number} translateX value to translate on axis x
 * @param {number} translateY value to translate on axis y
 * @return {object} appended chart container
 *
 */
const _addChartContainer = (root, width, height, translateX, translateY) => {
  return root
    .append('g')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + translateX + ',' + translateY + ')');
};

/**
 * It adds attributes to root element from passed attributes list
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} attributes list of attributes to be added on root element
 *
 */
const _addAttributes = (root, attributes = []) => {
  for (let attr of attributes) {
    const { key, value } = attr;

    if (key && value) {
      root.attr(key, value);
    }
  }
};

/**
 * It appends axis graphics to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {TimecoursePointDef} axisDef definition of given axis
 * @param {number} posX position X to place content // TODO KINDERSPISTAL
 * @param {number} posY position Y to place content
 * @param {number} axisExtraAttrs list of extra attributes to be added on content
 * @param {function} axisBuilder callback function to create axis graphics
 * @param {boolean} showAxisLabels flag to display labels or not
 * @param {number} labelPosX position X to place label content
 * @param {number} labelPosY position Y to place label content
 * @param {object} labelExtraAttrs list of extra attributes to be added on label content
 *
 */
const _addAxis = (
  root,
  axisDef,
  posX = 0,
  posY = 0,
  axisExtraAttrs = [],
  axisBuilder,
  showAxisLabels,
  labelPosX,
  labelPosY,
  labelExtraAttrs = []
) => {
  const { type } = axisDef;
  const translateValue = `${posX}, ${posY}`;
  const axisContent = root
    .append('g')
    .attr('class', `${type} axis`)
    .attr('transform', `translate(${translateValue})`);

  _addAttributes(axisContent, axisExtraAttrs);
  axisContent.call(axisBuilder());

  if (showAxisLabels) {
    const label = _formatAxisLabel(axisDef);
    // text label for the x axis
    if (label) {
      const labelContent = root
        .append('text')
        .attr('class', 'label axis')
        .attr('x', labelPosX)
        .attr('y', labelPosY)
        .style('text-anchor', 'middle')
        .text(label);

      _addAttributes(labelContent, labelExtraAttrs);
    }
  }
};

/**
 * It appends background graphics to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {TimecoursePointDef} axisDef definition of given axis
 * @param {number} width content`s width
 *
 */
const _addBackground = (root, width, height) => {
  root
    .append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);
};

/**
 * It appends line chart graphics to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {string} dAttrValue path d attribute
 *
 */
const _addLine = (root, dataset, dAttrValue) => {
  root
    .append('path')
    .datum(dataset)
    .attr('class', 'line')
    .attr('d', dAttrValue);
};

/**
 * It appends points graphics to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {number} cxAttrValue cx attribute
 * @param {number} cyAttrValue cy attribute
 *
 */
const _addPoints = (root, dataset, cxAttrValue, cyAttrValue) => {
  root
    .selectAll('.dot')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', cxAttrValue)
    .attr('cy', cyAttrValue)
    .attr('r', 2);
};

const bindMouseEvents = () => {};

/**
 * It creates a svg chart containing lines, dots, axis, labels
 * It mutates passed param
 *
 * @param {object} d3SVGRef svg content reference to append chart
 * @param {Object<string, TimecoursePointDef>} axis definition of axis
 * @param {object} points list of points to be created
 * @param {number} width width for whole content including lines, dots, axis, labels
 * @param {number} height height for whole content including lines, dots, axis, labels
 * @param {boolean} showAxisLabels flag to display labels or not
 */
const createLineChart = (
  d3SVGRef,
  axis,
  points = [],
  width,
  height,
  showAxisLabels = true
) => {
  // margin convention practice
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const _width = width - margin.left - margin.right;
  const _height = height - margin.top - margin.bottom;

  const { x: XAxis, y: YAxis } = axis;

  function createAxis(domainBottom, domainUpper, rangeBottom, rangeUpper) {
    return scaleLinear()
      .domain([domainBottom, domainUpper])
      .range([rangeBottom, rangeUpper]);
  }

  const maxX = _getMaxValue(points, XAxis.indexRef);
  const maxY = _getMaxValue(points, YAxis.indexRef);

  if (!maxX || !maxY) {
    return;
  }

  const parseXPoint = (point, index) => xScale(points[index][XAxis.indexRef]);
  const parseYPoint = point => yScale(point.y);

  // x axis
  const xScale = createAxis(0, maxX, 0, _width);
  const yScale = createAxis(0, maxY, _height, 0);
  // create line
  const _line = line()
    .x(parseXPoint)
    .y(parseYPoint);

  const dataset = points.map(point => {
    return { y: point[YAxis.indexRef] };
  });

  // Remove old D3 elements
  _removeChartContents(d3SVGRef);

  const chartWrapper = _addChartContainer(
    d3SVGRef,
    _width + margin.left + margin.right,
    _height + margin.top + margin.bottom,
    margin.left,
    margin.top
  );
  // add background
  _addBackground(chartWrapper, _width, _height);
  // call the x axis in a group tag
  _addAxis(
    chartWrapper,
    XAxis,
    undefined,
    _height,
    undefined,
    () => axisBottom(xScale),
    showAxisLabels,
    _width / 2,
    _height + margin.bottom / 2 + 10,
    undefined
  );
  // add y axis
  _addAxis(
    chartWrapper,
    YAxis,
    undefined,
    undefined,
    undefined,
    () => axisLeft(yScale),
    showAxisLabels,
    0 - _height / 2,
    0 - margin.left,
    [
      { key: 'transform', value: 'rotate(-90)' },
      { key: 'dy', value: '1em' },
    ]
  );
  // add line chart
  _addLine(chartWrapper, dataset, _line);
  // add chart points
  _addPoints(chartWrapper, dataset, parseXPoint, parseYPoint);
  return chartWrapper;
};

export { createLineChart };
