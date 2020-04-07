import { line } from 'd3-shape';

/**
 * It adds attributes to root element from passed attributes list
 *
 * @param {object} root svg element to be changed
 * @param {object} attributes list of attributes to be added on root element
 * @modifies {root}
 *
 */
const _addAttributes = (root, attributes = []) => {
  for (let attr of attributes) {
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

  if (!!unit) {
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
  return root
    .append('g')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + translateX + ',' + translateY + ')');
};

/**
 * It appends axis svg element to root element
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
const _addChartClipPath = (
  root,
  width,
  height,
  transparent = true,
  offset = 6
) => {
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

  dot
    .data(dataset)
    .attr('cx', cxAttrValue)
    .attr('cy', cyAttrValue);
};

// TODO KINDERSPITAL
const _setInteractionLine = (
  root,
  isPeekSet,
  isGlomerularSet,
  lineDataset,
  lineDAttrValue
) => {
  const interactorClassSelector = ' interaction line';
  const interactorSelector = interactorClassSelector.replace(/\s/gi, '.');

  if (!!isPeekSet && !!isGlomerularSet) {
    let interactionLine = root.selectAll(interactorSelector);

    // create if not existing
    if (interactionLine.empty()) {
      interactionLine = root
        .append('path')
        .attr('clip-path', 'url(#clip)')
        .attr('class', interactorClassSelector);
    }

    if (lineDataset) {
      interactionLine.datum(lineDataset);
    }
    interactionLine.attr('d', lineDAttrValue);
  } else {
    root.selectAll(interactorSelector).remove();
  }
};

const _fitIntoContainer = (gOuter, gInner) => {
  try {
    const {
      x: outerX,
      y: outerY,
      width: outerWidth,
      height: outerHeight,
    } = gOuter.node().getBBox();
    const {
      x: innerX,
      y: innerY,
      width: innerWidth,
      height: innerHeight,
    } = gInner.node().getBBox();

    let nextX = undefined;
    let nextY = undefined;

    if (innerX < outerX) {
      nextX = outerX > innerWidth ? outerX : innerWidth;
    } else if (innerX + 2 * innerWidth > outerWidth + outerX) {
      nextX = Math.abs(outerWidth - 2 * innerWidth);
    }

    if (innerY < outerY) {
      nextY = outerY > innerHeight ? outerY : innerHeight;
    } else if (innerY + 2 * innerHeight > outerHeight + outerY) {
      nextY = Math.abs(outerHeight - 2 * innerHeight);
    }

    return {
      x: nextX,
      y: nextY,
    };
  } catch (e) {
    return {
      x: undefined,
      y: undefined,
    };
  }
};

const _setInteractionLabel = (
  root,
  pointIdSelector,
  label,
  classRef,
  labelExtraAttrs
) => {
  const gPoint = root.select(`#${pointIdSelector}`);
  if (!gPoint) {
    return false;
  }

  const pointNode = gPoint.node();

  if (!pointNode) {
    return;
  }
  const labelIdSuffix = pointNode.id;

  const textPosX = pointNode.cx.baseVal.valueAsString;
  const textPosY = Number(pointNode.cy.baseVal.valueAsString) + 15;

  const textId = 'text-' + labelIdSuffix;
  const selector = classRef ? `.${classRef}.interaction.text` : `#${textId}`;
  const oldText = root.select(selector);
  let _text;

  // create or use old one
  if (!oldText.empty()) {
    _text = oldText;
  } else {
    _text = root
      .append('text')
      .attr('class', `${classRef} interaction text`)
      .attr('clip-path', 'url(#clip)');

    if (label) {
      _text.text(label);
    }
  }

  const gText = _text
    .attr('id', textId)
    .property('point-id', labelIdSuffix)
    .attr('x', textPosX)
    .attr('y', textPosY);

  const clipContainer = root.select('#clip');
  const { x: fitX, y: fitY } = _fitIntoContainer(clipContainer, gText);

  if (fitX >= 0) {
    gText.attr('x', fitX);
  }

  if (fitY >= 0) {
    gText.attr('y', fitY);
  }
  _addAttributes(gText, labelExtraAttrs);
  return true;
};

const _setInteractionLineHidden = (root, hidden = false) => {
  const interactorClassSelector = ' interaction line';
  const interactorSelector = interactorClassSelector.replace(/\s/gi, '.');

  root.selectAll(interactorSelector).classed('hidden', hidden);
};

const _removeInteractionLabel = (root, classRef) => {
  root.selectAll(`.${classRef}.interaction.text`).remove();
};

/**
 * It appends interaction points svg element to root element
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
const _addInteractionPoints = (
  root,
  peekPoint,
  glomerularPoint,
  lineDataset,
  lineDAttrValue
) => {
  // remove old class
  root.selectAll('.interaction.dot').attr('class', 'dot');
  const _setInteractionPoint = (point, classRef, label, labelExtraAttrs) => {
    if (point && point.id) {
      const pointSelector = point.id;
      const pointIdSelector = '#' + point.id;

      const interationPoint = root.select(pointIdSelector);
      interationPoint.attr('class', `${classRef} interaction dot`);
      _setInteractionLabel(
        root,
        pointSelector,
        label,
        classRef,
        labelExtraAttrs
      );
      return true;
    } else {
      _removeInteractionLabel(root, classRef);
    }
  };

  const isPeekSet = _setInteractionPoint(peekPoint, 'peek', 'P');
  const isGlomerularSet = _setInteractionPoint(
    glomerularPoint,
    'glomerular',
    'G'
  );
  _setInteractionLine(
    root,
    isPeekSet,
    isGlomerularSet,
    lineDataset,
    lineDAttrValue
  );
};

/**
 * It updates interaction points svg element with new dataset, cxAttrValue and cyAttrValue
 * It mutates passed param
 *
 * @param {object} root svg element to be changed
 * @param {object} dataset dataset to tie to content
 * @param {number} cxAttrValue cx attribute
 * @param {number} cyAttrValue cy attribute
 *
 */
const _updateInteractionPoints = (root, lineDataset, lineDAttrValue) => {
  root.selectAll('.interaction.text').each((data, index, group) => {
    const currentLabelText = group[index];
    _setInteractionLabel(root, currentLabelText['point-id']);
  });
  _setInteractionLine(root, true, true, lineDataset, lineDAttrValue);
};

const _setMoving = (root, pointId, classRef, isMoving) => {
  if (isMoving) {
    root.selectAll('.dot').classed('dragging selected', false);

    root
      .selectAll('.dot')
      .filter(`#${pointId}`)
      .classed('dragging selected', true);
    _setInteractionLabel(root, pointId, undefined, classRef, [
      { key: 'class', value: 'selected dragging' },
    ]);
  } else {
    root
      .selectAll(`.dot.selected.dragging`)
      .classed('selected dragging', false);
    root
      .selectAll(`.text.selected.dragging`)
      .classed('selected dragging', false);
  }
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
  lines: {
    addNode: _addLine,
    updateNode: _updateLine,
  },
  points: {
    addNode: _addPoints,
    updateNode: _updatePoints,
  },
  interactionPoint: {
    addNode: _addInteractionPoints,
    updateNode: _updateInteractionPoints,
    setLineHidden: _setInteractionLineHidden,
    setInteractionLabel: _setInteractionLabel,
    setMoving: _setMoving,
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
