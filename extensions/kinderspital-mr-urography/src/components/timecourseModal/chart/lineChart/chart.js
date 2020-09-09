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
  root
    .append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);

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
const _addChartClipPath = (
  root,
  width,
  height,
  transparent = false,
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

  dot
    .data(dataset)
    .attr('cx', cxAttrValue)
    .attr('cy', cyAttrValue);
};

/**
 * It updates points svg element with new dataset, cxAttrValue and cyAttrValue
 *
 * @param {object} root svg element to be changed
 * @param {boolean} isPeekSet boolean to define if peek point is already set
 * @param {boolean} isGlomerularSet boolean to define if glomerular point is already set
 * @param {object} lineDataset dataset to tie to content
 * @param {*} lineDAttrValue svg d attribute for given line
 *
 * @modifies {root}
 *
 */
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

/**
 * It returns a pair of position {x, y} for gInner content which is inside gOuter totally.
 *
 * @param {object} gOuter svg element to be the outer content
 * @param {object} gInner svg element to be the inner content. I.e the one to be fit into outer content.
 *
 * @return {object} point position
 *
 */
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
/**
 * It set/update interaction label for given point (pointIdSelector or labelClassSelector)
 *
 * @param {object} root svg element to be changed
 * @param {string} pointIdSelector selector of point
 * @param {string} label label text
 * @param {string} labelClassSelector text for label class
 * @param {object} labelExtraAttrs list of extra attributes to be added on label content
 * @modifies {root}
 *
 * @return {boolean} return true in case of success and false otherwise
 */
const _setInteractionLabel = (
  root,
  pointIdSelector,
  label,
  labelClassSelector,
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
  const selector = labelClassSelector
    ? `.${labelClassSelector}.interaction.text`
    : `#${textId}`;
  const oldText = root.select(selector);
  let _text;

  // create or use old one
  if (!oldText.empty()) {
    _text = oldText;
  } else {
    _text = root
      .append('text')
      .attr('class', `${labelClassSelector} interaction text`)
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

/**
 * It changes interaction line visibility
 * @param {object} root svg element to be changed
 * @param {boolean} hidden flag to define if line is hidden or not
 *
 * @modifies {root}
 */
const _setInteractionLineHidden = (root, hidden = false) => {
  const interactorClassSelector = ' interaction line';
  const interactorSelector = interactorClassSelector.replace(/\s/gi, '.');

  root.selectAll(interactorSelector).classed('hidden', hidden);
};

/**
 * It removes text label of given classSelector element
 * @param {object} root svg element to be changed
 * @param {string} classSelector class selector of element to be processed
 *
 * @modifies {root}
 */
const _removeInteractionLabel = (root, classSelector) => {
  root.selectAll(`.${classSelector}.interaction.text`).remove();
};

/**
 * It get a given interaction point
 *
 * @param {object} root svg element to be changed
 * @param {string} classSelector class selector of element to be processed
 *
 * @return {object}
 */
const _getInteractionPoint = (root, classSelector) => {
  return root.selectAll('.interaction.dot').filter(`.${classSelector}`);
};

/**
 * It appends interaction points svg element to root element
 *
 * @param {object} root svg element to be changed
 * @param {object} peekPoint svg element representing peek point
 * @param {number} glomerularPoint svg element representing glomerular point
 * @param {object} lineDataset dataset to tie to content
 * @param {*} lineDAttrValue svg d attribute for given line
 * @modifies {root}
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

  const isPeekSet = _setInteractionPoint(
    peekPoint,
    chart.interactionPoint.peekClassSelector,
    'P'
  );
  const isGlomerularSet = _setInteractionPoint(
    glomerularPoint,
    chart.interactionPoint.glomerularClassSelector,
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

const _buildInteractionDataset = (
  gPeekPoint,
  peekIndex,
  gGlomerularPoint,
  glomerularIndex,
  parseXPoint,
  parseYPoint,
  xAxisScale,
  yAxisScale
) => {
  if (!gPeekPoint || !gGlomerularPoint) {
    return;
  }

  const peekData = gPeekPoint.__data__;
  const glomerularData = gGlomerularPoint.__data__;

  const getLower = (pointA, pointB) => {
    const parsedYA = parseYPoint(xAxisScale)(pointA, pointA.x);
    const parsedYB = parseYPoint(yAxisScale)(pointB, pointB.x);

    return parsedYA < parsedYB ? pointA : pointB;
  };

  const createLowerPoint = (pointRef, minorPoint) => {
    const parsedYMinor = parseYPoint(yAxisScale)(minorPoint, minorPoint.x);
    const lowerY = Math.floor(parsedYMinor / 2);
    return { x: pointRef.x, y: minorPoint.y, parsedY: lowerY };
  };

  const peekPoint = { x: peekIndex, ...peekData };
  const glomerularPoint = { x: glomerularIndex, ...glomerularData };

  const minorPoint = getLower(peekPoint, glomerularPoint);
  const peekLowerPoint = createLowerPoint(peekPoint, minorPoint);
  const glomerularLowerPoint = createLowerPoint(glomerularPoint, minorPoint);

  return [peekPoint, peekLowerPoint, glomerularLowerPoint, glomerularPoint];
};
/**
 * It updates interaction points dataset or svg dAttribute
 *
 * @param {object} root svg element to be changed
 * @param {object} lineDataset dataset to tie to content
 * @param {*} lineDAttrValue svg d attribute for given line
 * @modifies {root}
 *
 */
const _updateInteractionPoints = (root, lineDataset, lineDAttrValue) => {
  const peekPoint = chart.interactionPoint.getPeekPoint(root);
  const glomerularPoint = chart.interactionPoint.getGlomerularPoint(root);

  const isPeekSet = peekPoint && !peekPoint.empty();
  const isGlomerularSet = glomerularPoint && !glomerularPoint.empty();

  root.selectAll('.interaction.text').each((data, index, group) => {
    const currentLabelText = group[index];
    _setInteractionLabel(root, currentLabelText['point-id']);
  });
  _setInteractionLine(
    root,
    isPeekSet,
    isGlomerularSet,
    lineDataset,
    lineDAttrValue
  );
};

/**
 * Dataset for interaction point is groupped differently from original dataset. So this function prepares/adapt it for original parser
 * @param {function} parseAxis d3js axis parser method for X Axis
 * @param {object} axisScale d3 continuos scale for X Axis
 * @return {function} it returns a function to be consumed as parser for X
 */
const _parseInteractionXPoint = (parseAxis, axisScale) => (
  interactionPoint,
  interactionIndex
) => {
  const { x: index, y } = interactionPoint;
  const point = {
    y,
  };
  return parseAxis(axisScale)(point, index);
};

/**
 *
 * Dataset for interaction point is groupped differently from original dataset. So this function prepares/adapt it for original parser
 * @param {function} parseAxis d3js axis parser method for Y Axis
 * @param {object} axisScale d3 continuos scale for Y Axis
 * @return {function} it returns a function to be consumed as parser for Y
 */
const _parseInteractionYPoint = (parseAxis, axisScale) => (
  interactionPoint,
  interactionIndex
) => {
  const { x: index, y, parsedY } = interactionPoint;
  const point = {
    y,
  };
  // in case no parsed y yet parse it now
  return parsedY || parseAxis(axisScale)(point, index);
};

/**
 * To get/set default interval between Peek and Glomerular points
 *
 * @param {number} [value] new value for interval
 *
 * @return {number} current value of defaultInterval
 *
 */
const defaultInterval = value => {
  // set
  if (value) {
    chart.interactionPoint.defaultIntervalValue = value;
  }

  return chart.interactionPoint.defaultIntervalValue;
};

/**
 * It returns true if given gPoint contains given class
 *
 * @param {object} gPoint svg element to inspect
 * @param {string} classSelector class to look for
 *
 * @return {boolean} true if gPoint has class classSelector
 *
 */
const _isPointOf = (gPoint, classSelector) => {
  const currentClassName = gPoint.className.baseVal;

  return currentClassName.indexOf(classSelector) >= 0;
};

/**
 * It updates points/line/label when moving (occurring or ending)
 * @param {object} root svg element to be changed
 * @param {string} pointIdSelector id selector of element to be processed (points related)
 * @param {string} classSelector class selector of element to be processed (interaction points related)
 * @param {boolean} isMoving if moving or not
 *
 * @modifies {root}
 */
const _setMoving = (root, pointIdSelector, classSelector, isMoving) => {
  if (isMoving) {
    root.selectAll('.dot').classed('dragging selected', false);

    root
      .selectAll('.dot')
      .filter(`#${pointIdSelector}`)
      .classed('dragging selected', true);
    _setInteractionLabel(root, pointIdSelector, undefined, classSelector, [
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
    getPoints: _getPoints,
  },
  interactionPoint: {
    addNode: _addInteractionPoints,
    updateNode: _updateInteractionPoints,
    buildDataset: _buildInteractionDataset,
    setLineHidden: _setInteractionLineHidden,
    setInteractionLabel: _setInteractionLabel,
    setMoving: _setMoving,
    getGlomerularPoint: root =>
      _getInteractionPoint(
        root,
        chart.interactionPoint.glomerularClassSelector
      ),
    getPeekPoint: root =>
      _getInteractionPoint(root, chart.interactionPoint.peekClassSelector),
    defaultInterval: defaultInterval,
    peekClassSelector: 'peek',
    glomerularClassSelector: 'glomerular',
    isPeekPoint: gPoint =>
      _isPointOf(gPoint, chart.interactionPoint.peekClassSelector),
    isGlomerularPoint: gPoint =>
      _isPointOf(gPoint, chart.interactionPoint.glomerularClassSelector),
    parseXPoint: _parseInteractionXPoint,
    parseYPoint: _parseInteractionYPoint,
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
