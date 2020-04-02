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
 * It appends chart svg element container to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {number} width width of container
 * @param {number} height height of container
 * @param {number} translateX value to translate on axis x
 * @param {number} translateY value to translate on axis y
 * @return {object} appended chart container (svg element)
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
 * It appends axis svg element to root element
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
 * @return {object} axis svg element
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

  return axisContent;
};

/**
 * It scales axis graphics
 * It mutates passed param
 *
 * @param {object} sourceGraphicsXAxis original d3 graphics to be proccessed (x Axis)
 * @param {object} sourceGraphicsYAxis original d3 graphics to be proccessed (y Axis)
 * @param {object} xAxisGenerator d3 X axis generator
 * @param {object} yAxisGenerator d3 Y axis generator
 * @param {object} newXAxisScale d3 continuos scale for X Axis
 * @param {object} newYAxisScale d3 continuos scale for Y Axis
 *
 */
const _scaleAxisGraphics = (
  sourceGraphicsXAxis,
  sourceGraphicsYAxis,
  xAxisGenerator,
  yAxisGenerator,
  newXAxisScale,
  newYAxisScale
) => {
  const newXAxis = xAxisGenerator.scale(newXAxisScale);
  const newYAxis = yAxisGenerator.scale(newYAxisScale);

  sourceGraphicsXAxis.call(newXAxis);
  sourceGraphicsYAxis.call(newYAxis);
};

/**
 * It appends background svg element to root element and also a clip path for chart boundaries
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {number} width content`s width
 * @param {number} height content`s height
 *
 */
const _addChartClipPath = (root, width, height) => {
  root
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  root
    .append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);
};

/**
 * It appends line chart svg element to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {string} dAttrValue path d attribute
 *
 * @return {object}  svg line element line
 */
const _addLine = (root, dataset, dAttrValue) => {
  return root
    .append('path')
    .attr('clip-path', 'url(#clip)')
    .datum(dataset)
    .attr('class', 'line')
    .attr('d', dAttrValue);
};

/**
 * It updates line chart svg element with new dataset and dAttrValue value
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {string} dAttrValue path d attribute
 */
const _updateLine = (root, dataset = [], dAttrValue) => {
  const line = root.select('.line');

  if (dataset && dataset.length > 0) {
    line.datum(dataset);
  }

  line.attr('d', dAttrValue);
};

/**
 * It appends points svg element to root element
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {number} cxAttrValue cx attribute
 * @param {number} cyAttrValue cy attribute
 *
 * @return {object} points svg element
 *
 */
const _addPoints = (root, dataset, cxAttrValue, cyAttrValue) => {
  return root
    .selectAll('.dot')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('clip-path', 'url(#clip)')
    .attr('cx', cxAttrValue)
    .attr('cy', cyAttrValue)
    .attr('r', 2);
};

/**
 * It updates points svg element with new dataset, cxAttrValue and cyAttrValue
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {number} cxAttrValue cx attribute
 * @param {number} cyAttrValue cy attribute
 *
 */
const _updatePoints = (root, dataset = [], cxAttrValue, cyAttrValue) => {
  const dot = root.selectAll('.dot');

  dot
    .data(dataset)
    .attr('cx', cxAttrValue)
    .attr('cy', cyAttrValue);
};

/**
 * It removes children nodes from root param.
 * It mutates passed param
 * @param {object} root svg element to remove children content
 */
const _removeChartContents = root => {
  root.selectAll('*').remove();
};

const chart = {
  axis: {
    addNode: _addAxis,
    scaleGraphics: _scaleAxisGraphics,
  },
  lines: {
    addNode: _addLine,
    updateNode: _updateLine,
  },
  points: {
    addNode: _addPoints,
    updateNode: _updatePoints,
  },
  background: {
    addNode: _addChartClipPath,
  },
  container: {
    addNode: _addChartContainer,
  },
  removeContents: _removeChartContents,
};

export default chart;
