/**
 * It adds attributes to root element from passed attributes list
 *
 * @param {object} root svg element to be changed
 * @param {object} attributes list of attributes to be added on root element
 * @modifies {root}
 *
 */
const _addAttributes = (root, attributes = []) => {
  for (const attr of attributes) {
    const { key, value } = attr;

    if (key && value) {
      if (key === 'class') {
        root.classed(value, true);
      } else {
        root.attr(key, value);
      }
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

  if (unit) {
    formattedLabel += `(${unit})`;
  }

  return formattedLabel;
};

/**
 * It appends chart svg element container to root element
 *
 * @param {object} root svg element to be changed
 * @param {number} width width of container
 * @param {number} height height of container
 * @param {number} translateX value to translate on axis x
 * @param {number} translateY value to translate on axis y
 * @modifies {root}
 *
 * @return {object} appended chart container (svg element)
 */
const _addChartContainer = (root, width, height, translateX, translateY) => {
  root.append('rect').attr('class', 'background').attr('width', width).attr('height', height);

  return root
    .append('g')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + translateX + ',' + translateY + ')');
};

const _addLegend = (root, width, height, posX, posY) => {
  const legendContainer = root
    .append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + posX + ',' + posY + ')');

  legendContainer
    .append('rect')
    .attr('class', 'legend-background')
    .attr('width', width)
    .attr('height', height);

  return legendContainer;
};

const _setLegendLabels = (root, labels, colors, itemHeight, itemWidth, textEllipses) => {
  const yOffset = itemHeight / 2;
  const textLeft = 20;

  // Add one dot in the legend for each
  root
    .selectAll('labelDots')
    .data(labels)
    .enter()
    .append('circle')
    .attr('cx', 10)
    .attr('cy', (_d, i) => yOffset + i * itemHeight)
    .attr('r', 5)
    .style('fill', (_d, i) => colors[i]);

  root
    .selectAll('labelText')
    .data(labels)
    .enter()
    .append('text')
    .attr('x', textLeft)
    .attr('y', (_d, i) => yOffset + i * itemHeight)
    .style('fill', (_d, i) => colors[i])
    .append('tspan')
    .style('alignment-baseline', 'middle')
    .text(d => d)
    .each(textEllipses(itemWidth - textLeft, 1));
};

/**
 * It appends axis svg element to root element
 *
 * @param {object} root svg element to be changed
 * @param {TimecoursePointDef} axisDef definition of given axis
 * @param {number} posX position X to place content
 * @param {number} posY position Y to place content
 * @param {number} axisExtraAttrs list of extra attributes to be added on content
 * @param {function} axisBuilder callback function to create axis graphics
 * @param {boolean} showAxisLabels flag to display labels or not
 * @param {number} labelPosX position X to place label content
 * @param {number} labelPosY position Y to place label content
 * @param {object} labelExtraAttrs list of extra attributes to be added on label content
 * @modifies {root}
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
  labelExtraAttrs = [],
  showAxisGrid
) => {
  const { type } = axisDef;
  const showAxisGridClass = showAxisGrid ? 'grid' : '';
  const translateValue = `${posX}, ${posY}`;
  const axisContent = root
    .append('g')
    .attr('class', `${type} ${showAxisGridClass} axis`)
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
 *
 * @param {object} sourceGraphicsXAxis original d3 graphics to be proccessed (x Axis)
 * @param {object} sourceGraphicsYAxis original d3 graphics to be proccessed (y Axis)
 * @param {object} xAxisGenerator d3 X axis generator
 * @param {object} yAxisGenerator d3 Y axis generator
 * @param {object} newXAxisScale d3 continuos scale for X Axis
 * @param {object} newYAxisScale d3 continuos scale for Y Axis
 * @modifies {sourceGraphicsXAxis|sourceGraphicsYAxis}
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
 *
 * @param {object} root svg element to be changed
 * @param {number} width content`s width
 * @param {number} height content`s height
 * @param {boolean} transparent background to be transparent or not
 * @param {number} offset content`s clip offset
 * @modifies {root}
 *
 */
const _addChartClipPath = (root, width, height, transparent = false, offset = 6) => {
  const translateOffset = -offset / 2;
  root
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('transform', `translate(${translateOffset}, ${translateOffset})`)
    .attr('width', width + offset)
    .attr('height', height + offset);

  root
    .append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height)
    .classed('transparent', transparent);
};

const _addSeries = (root, seriesIndex, style) => {
  return root
    .append('g')
    .attr('id', `series_${seriesIndex}`)
    .attr('class', 'series')
    .attr('stroke', style.color || '#ffffff');
};

/**
 * It appends line chart svg element to root element
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {string} dAttrValue path d attribute
 * @modifies {root}
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
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {string} dAttrValue path d attribute
 * @modifies {root}
 *
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
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {number} cxAttrValue cx attribute
 * @param {number} cyAttrValue cy attribute
 * @modifies {root}
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
    .attr('id', (point, index) => {
      return `point-${index}`;
    })
    .attr('class', 'dot')
    .attr('clip-path', 'url(#clip)')
    .attr('cx', cxAttrValue)
    .attr('cy', cyAttrValue)
    .attr('r', 2);
};

/**
 * It return points from root parent
 *
 * @param {object} root svg element to be changed
 * @return {object} points svg element
 *
 */
const _getPoints = root => {
  return root.selectAll('.dot');
};

/**
 * It updates points svg element with new dataset, cxAttrValue and cyAttrValue
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {number} cxAttrValue cx attribute
 * @param {number} cyAttrValue cy attribute
 * @modifies {root}
 *
 */
const _updatePoints = (root, dataset = [], cxAttrValue, cyAttrValue) => {
  const dot = root.selectAll('.dot');

  dot.data(dataset).attr('cx', cxAttrValue).attr('cy', cyAttrValue);
};

/**
 * It removes children nodes from root param.
 *
 * @param {object} root svg element to remove children content
 * @modifies {root}
 *
 */
const _removeChartContents = root => {
  root.selectAll('*').remove();
};

const chart = {
  axis: {
    addNode: _addAxis,
    scaleGraphics: _scaleAxisGraphics,
  },
  series: {
    addNode: _addSeries,
  },
  lines: {
    addNode: _addLine,
    updateNode: _updateLine,
  },
  points: {
    addNode: _addPoints,
    updateNode: _updatePoints,
    getPoints: _getPoints,
  },
  background: {
    addNode: _addChartClipPath,
  },
  container: {
    addNode: _addChartContainer,
  },
  legend: {
    addNode: _addLegend,
    setLabels: _setLegendLabels,
  },
  removeContents: _removeChartContents,
};

export default chart;
