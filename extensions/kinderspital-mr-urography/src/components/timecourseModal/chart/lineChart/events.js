import { zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import { event, select } from 'd3-selection';
import { line } from 'd3-shape';
import { zoomIdentity, zoomTransform, mouse, bisector } from 'd3';

import chart from './chart';

const d3ZoomNativeEvents = [
  'wheel.zoom',
  'mousedown.zoom',
  'dblclick.zoom',
  'touchstart.zoom',
  'touchmove.zoom',
  'touchend.zoom touchcancel.zoom',
];
/**
 * Object to override native zoom events.
 * It defines a specific callback for a event name.
 *
 * @type {Object<string, function>} zoomEvents <zoom d3 event name, callback method>
 */
const zoomEvents = {
  'dblclick.zoom': (root, zoom) => {
    _resetZoom(root, zoom);
  },
};
/**
 * Function to filter a zoom event
 * Its used to change mouse binding but keeping d3 zoom native callback method
 * @type {function}
 */
const zoomEventsFilter = () => {
  const { type } = event || {};
  const validation = _zoomButtonsDefinition[type];

  if (typeof validation === 'function') {
    return validation(event);
  }
};

/**
 * Object to map an event type to a specific filter validation method
 * Used on eventsFilter proccess.
 *
 * @type {Object<string, function>} _zoomButtonsDefinition
 */
const _zoomButtonsDefinition = {
  mousedown: event => {
    const { ctrlKey, button } = event || {};

    return !ctrlKey && button === 1;
  },
  wheel: event => {
    const { ctrlKey, button } = event || {};

    return !ctrlKey && button === 0;
  },
};

/**
 * It resets given root
 *
 * @param {object} root svg element to be reset
 * @param {object} zoom d3 zoom object
 *
 * @modifies {root}
 */
const _resetZoom = (root, zoom) => {
  if (root) {
    root
      .transition()
      .duration(750)
      .call(zoom.transform, zoomIdentity);
  }
};

const DEFAULT_MAX_ZOOM_SCALE = 20;

const _zoom = zoom().scaleExtent([1, DEFAULT_MAX_ZOOM_SCALE]);

const _bindZoom = (
  root,
  gX,
  gY,
  xAxisScale,
  yAxisScale,
  xAxisGenerator,
  yAxisGenerator,
  parseXPoint,
  parseYPoint,
  dataset
) => {
  _zoom.on('zoom', _zoomListener).filter(zoomEventsFilter);

  _removeListeners();
  _setListeners();

  function _removeListeners() {
    for (let eventName of d3ZoomNativeEvents) {
      root.on(eventName, null);
    }
  }

  function _setListeners() {
    const keys = Object.keys(zoomEvents);

    for (let key of keys) {
      root.call(_zoom).on(key, zoomEvents[key].bind(undefined, root, _zoom));
    }
  }

  function _zoomListener() {
    const transformedXAxisScale = event.transform.rescaleX(xAxisScale);
    const transformedYAxisScale = event.transform.rescaleY(yAxisScale);

    chart.axis.scaleGraphics(
      gX,
      gY,
      xAxisGenerator,
      yAxisGenerator,
      transformedXAxisScale,
      transformedYAxisScale
    );

    // create line
    const _line = line()
      .x(parseXPoint(transformedXAxisScale))
      .y(parseYPoint(transformedYAxisScale));

    chart.lines.updateNode(root, dataset, _line);
    chart.points.updateNode(
      root,
      dataset,
      parseXPoint(transformedXAxisScale),
      parseYPoint(transformedYAxisScale)
    );

    // create line
    const _interactionline = line()
      .x(chart.interactionPoint.parseXPoint(parseXPoint, transformedXAxisScale))
      .y(
        chart.interactionPoint.parseYPoint(parseYPoint, transformedYAxisScale)
      );

    chart.interactionPoint.updateNode(root, undefined, _interactionline);
  }

  return _zoom;
};

/**
 * Bisector method to find closest point (considering Axis Y), using d3js bisector strategy.
 *
 * @return {object | undefined} returns the closest point.
 */
const findClosestIndexY = bisector(gPoint => {
  const gPointCx = gPoint.cx.baseVal.value;
  return gPointCx;
}).left;

/**
 * Find the closest point to mousePoint from a list of svg elements
 * It looks for all possible points
 *
 * @param {object} gNodes svg elements to look into
 * @param {object} mousePoint d3 mouse point
 * @return {number | undefined} returns the closest point index.
 */
function mouseClosestPointIndex(gNodes, mousePoint) {
  let nodesLength = gNodes.length;
  let precision = 1;
  let bestIndex;
  let bestDistance = Infinity;

  function distance(_gPoint, _mousePoint) {
    const getDifferential = (axisRef, indexRef) => {
      const pointAAxisRef = _gPoint[axisRef].baseVal.value;
      const pointBAxisRef = _mousePoint[indexRef];

      return pointAAxisRef - pointBAxisRef;
    };

    const dx = getDifferential('cx', 0);
    const dy = getDifferential('cy', 1);

    return dx * dx + dy * dy;
  }

  // linear scan for coarse approximation
  let gScan;
  let scanDistance;
  let scanIndex;

  for (scanIndex = 0; scanIndex < nodesLength; scanIndex += precision) {
    gScan = gNodes[scanIndex];
    scanDistance = distance(gScan, mousePoint);

    if (scanDistance < bestDistance) {
      bestIndex = scanIndex;
      bestDistance = scanDistance;
    }
  }

  return bestIndex;
}

const _bindPointInteraction = (
  root,
  points,
  xAxisScale,
  yAxisScale,
  parseXPoint,
  parseYPoint,
  peekIndex,
  glomerularIndex,
  movingPointsCallback
) => {
  const gDots = chart.points.getPoints(root);
  const dotsNodes = gDots.nodes();

  function _setListeners() {
    root.on('mousedown', mouseDownListener);

    const existingGGlomerularPoint = chart.interactionPoint.getGlomerularPoint(
      root
    );

    // initialize events in case existing gpoint already
    if (!existingGGlomerularPoint.empty()) {
      const rootNode = root.node();

      const existingGGlomerularPointNode = existingGGlomerularPoint.node();

      if (
        existingGGlomerularPointNode.id &&
        existingGGlomerularPointNode.id.includes(glomerularIndex) >= 0
      ) {
        _setDragListeners(
          rootNode,
          existingGGlomerularPoint,
          dotsNodes,
          peekIndex,
          dotsNodes.length
        );
      }
    }
  }

  function _removeListeners() {
    const gGlomerularPoint = chart.interactionPoint.getGlomerularPoint(root);

    if (gGlomerularPoint) {
      _removeDragListeners(gGlomerularPoint);
    }
    root.on('mousedown', null);
  }
  function _setDragListeners(
    rootNode,
    gElement,
    pathNodes,
    infIndex = 0,
    supIndex
  ) {
    function _startListener() {
      select(this).classed('selected', true);
      let glomerularIndex;

      chart.interactionPoint.setLineHidden(root, true);
      event.on('drag', _dragListener).on('end', _endListener);
      function _dragListener() {
        const mousePoint = mouse(this);
        const closestIndex = findClosestIndexY(pathNodes, mousePoint[0], 1);

        // validate next index
        if (closestIndex > infIndex && closestIndex < supIndex) {
          const selectedData = dotsNodes[closestIndex];
          if (selectedData) {
            chart.interactionPoint.setMoving(
              root,
              selectedData.id,
              chart.interactionPoint.glomerularClassSelector,
              true
            );
            glomerularIndex = closestIndex;
          }
        }
      }

      function _endListener() {
        chart.interactionPoint.setLineHidden(root, false);

        const rootNode = root.node();
        const currentZoomTransform = zoomTransform(rootNode);
        const gPeekPoint = dotsNodes[infIndex];
        const gGlomerularPoint = dotsNodes[glomerularIndex];

        chart.interactionPoint.setMoving(
          root,
          glomerularIndex,
          chart.interactionPoint.glomerularClassSelector,
          false
        );

        placePoints(
          rootNode,
          currentZoomTransform,
          infIndex,
          glomerularIndex,
          gPeekPoint,
          gGlomerularPoint
        );
        select(this).classed('selected', false);
      }
    }

    const _drag = drag().on('start', _startListener);

    _drag.container(rootNode);
    gElement.call(_drag);
    gElement.classed('draggable', true);
  }

  function _removeDragListeners(gElement) {
    if (!gElement.empty()) {
      gElement.on('drag', null);
      gElement.classed('draggable', false);
    }
  }

  const placePoints = (
    rootNode,
    zoomTransform,
    peekIndex,
    glomerularIndex,
    gPeekPoint,
    gGlomerularPoint
  ) => {
    const transformedXAxisScale =
      (zoomTransform && zoomTransform.rescaleX(xAxisScale)) || xAxisScale;
    const transformedYAxisScale =
      (zoomTransform && zoomTransform.rescaleY(yAxisScale)) || yAxisScale;

    // remove current gGlomerular point listeners
    const currentGGlomerularPoint = chart.interactionPoint.getGlomerularPoint(
      root
    );
    _removeDragListeners(root, currentGGlomerularPoint);

    const dataset = chart.interactionPoint.buildDataset(
      gPeekPoint,
      peekIndex,
      gGlomerularPoint,
      glomerularIndex,
      parseXPoint,
      parseYPoint,
      transformedXAxisScale,
      transformedYAxisScale
    );

    // create line
    const _line = line()
      .x(chart.interactionPoint.parseXPoint(parseXPoint, transformedXAxisScale))
      .y(
        chart.interactionPoint.parseYPoint(parseYPoint, transformedYAxisScale)
      );

    // set interaction points
    chart.interactionPoint.addNode(
      root,
      gPeekPoint,
      gGlomerularPoint,
      dataset,
      _line
    );

    // set gGlomerular drag listeners
    const nextGGlomerularPoint = chart.interactionPoint.getGlomerularPoint(
      root
    );

    if (nextGGlomerularPoint) {
      _setDragListeners(
        rootNode,
        nextGGlomerularPoint,
        dotsNodes,
        peekIndex,
        dotsNodes.length
      );

      const nextDefaultTimecourseInterval = Math.abs(
        points[peekIndex][0] - points[glomerularIndex][0]
      );

      // change local defaultInterval value
      chart.interactionPoint.defaultInterval(nextDefaultTimecourseInterval);
      movingPointsCallback(
        peekIndex,
        glomerularIndex,
        nextDefaultTimecourseInterval
      );
    }
  };

  const mouseDownListener = () => {
    const mousePoint = mouse(root.node());
    const closestIndex = mouseClosestPointIndex(dotsNodes, mousePoint);

    const closestPoint = dotsNodes[closestIndex];

    if (!closestPoint) {
      return;
    }
    // do nothing in case current is an already placed peek point
    if (chart.interactionPoint.isPeekPoint(closestPoint)) {
      return;
    }

    // in case current is not a peek or glomerular place automatically p/g
    if (!chart.interactionPoint.isGlomerularPoint(closestPoint)) {
      const rootNode = root.node();
      const currentZoomTransform = zoomTransform(rootNode);

      const defaultTimecourseInterval = chart.interactionPoint.defaultInterval();
      const glomerularTimestamp =
        points[closestIndex][0] + defaultTimecourseInterval;
      let _nextGlomerularIndex;

      for (let it = closestIndex + 1; it < points.length; it++) {
        const currentTimestamp = points[it][0];
        if (currentTimestamp > glomerularTimestamp) {
          _nextGlomerularIndex = it;
          break;
        }
      }

      if (!_nextGlomerularIndex) {
        _nextGlomerularIndex = dotsNodes.length - 1;
      }
      // find the best match between next and previous possible glomerular indexes
      _nextGlomerularIndex =
        points[_nextGlomerularIndex] &&
        points[_nextGlomerularIndex - 1] &&
        Math.abs(points[_nextGlomerularIndex][0] - glomerularTimestamp) <
          Math.abs(points[_nextGlomerularIndex - 1][0] - glomerularTimestamp)
          ? _nextGlomerularIndex
          : _nextGlomerularIndex - 1;

      let gGlomerularPoint = dotsNodes[_nextGlomerularIndex];

      if (!gGlomerularPoint) {
        _nextGlomerularIndex = dotsNodes.length - 1;
        gGlomerularPoint = dotsNodes[_nextGlomerularIndex];
      }

      placePoints(
        rootNode,
        currentZoomTransform,
        closestIndex,
        _nextGlomerularIndex,
        closestPoint,
        gGlomerularPoint
      );
    }
  };

  _removeListeners();
  _setListeners();
};

const bindMouseEvents = (
  root,
  points,
  gX,
  gY,
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
) => {
  if (!root) {
    return;
  }

  _bindZoom(
    root,
    gX,
    gY,
    xAxisScale,
    yAxisScale,
    xAxisGenerator,
    yAxisGenerator,
    parseXPoint,
    parseYPoint,
    dataset
  );

  _bindPointInteraction(
    root,
    points,
    xAxisScale,
    yAxisScale,
    parseXPoint,
    parseYPoint,
    peekIndex,
    glomerularIndex,
    movingPointsCallback
  );
};

const events = {
  bindMouseEvents,
  external: {
    resetZoom: root => {
      _resetZoom(root, _zoom);
    },
  },
};

export default events;
