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
      .x(_parseInteractionXPoint(parseXPoint, transformedXAxisScale))
      .y(_parseInteractionYPoint(parseYPoint, transformedYAxisScale));

    chart.interactionPoint.updateNode(root, undefined, _interactionline);
  }

  return _zoom;
};

// TODO KINDERSPITAL
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
 * Bisector method to find closest point, using d3js bisector strategy.
 *
 * @return {object | undefined} returns the closest point.
 */
const bisect = bisector(gPoint => {
  const gPointCx = gPoint.cx.baseVal.value;
  return gPointCx;
}).left;

const _bindPointInteraction = (
  root,
  xAxisScale,
  yAxisScale,
  parseXPoint,
  parseYPoint,
  movingPointsCallback
) => {
  const gDots = chart.points.getPoints(root);
  const gNodes = gDots.nodes();

  function _setListeners() {
    gDots.on('mousedown', mouseDownListener);

    const nextGGlomerularPoint = chart.interactionPoint.getGlomerularPoint(
      root
    );

    // initialize events in case existing gpoint already
    if (nextGGlomerularPoint) {
      const rootNode = root.node();

      _setDragListeners(
        rootNode,
        nextGGlomerularPoint,
        gNodes,
        0,
        gNodes.length
      );
    }
  }

  function _removeListeners() {
    const gGlomerularPoint = chart.interactionPoint.getGlomerularPoint(root);

    if (gGlomerularPoint) {
      _removeDragListeners(gGlomerularPoint);
    }
    gDots.on('mousedown', null);
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
        const closestIndex = bisect(pathNodes, mousePoint[0], 1);

        // validate next index
        if (closestIndex > infIndex && closestIndex < supIndex) {
          const selectedData = gNodes[closestIndex];
          if (selectedData) {
            chart.interactionPoint.setMoving(
              root,
              selectedData.id,
              chart.interactionPoint.glomerularClassSelector,
              true
            );

            console.log('glomerularIndex', glomerularIndex);
            glomerularIndex = closestIndex;
          }
        }
      }

      function _endListener() {
        chart.interactionPoint.setLineHidden(root, false);

        const rootNode = root.node();
        const currentZoomTransform = zoomTransform(rootNode);
        const gPeekPoint = gNodes[infIndex];
        const gGlomerularPoint = gNodes[glomerularIndex];

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

    const buildInteractionDataset = (
      gPeekPoint,
      peekIndex,
      gGlomerularPoint,
      glomerularIndex
    ) => {
      if (!gPeekPoint || !gGlomerularPoint) {
        return;
      }

      const peekData = gPeekPoint.__data__;
      const glomerularData = gGlomerularPoint.__data__;

      const getLower = (pointA, pointB) => {
        const parsedYA = parseYPoint(transformedXAxisScale)(pointA, pointA.x);
        const parsedYB = parseYPoint(transformedYAxisScale)(pointB, pointB.x);

        return parsedYA < parsedYB ? pointA : pointB;
      };

      const createLowerPoint = (pointRef, minorPoint) => {
        const parsedYMinor = parseYPoint(transformedYAxisScale)(
          minorPoint,
          minorPoint.x
        );
        const lowerY = Math.floor(parsedYMinor / 2);
        return { x: pointRef.x, y: minorPoint.y, parsedY: lowerY };
      };

      const peekPoint = { x: peekIndex, ...peekData };
      const glomerularPoint = { x: glomerularIndex, ...glomerularData };

      const minorPoint = getLower(peekPoint, glomerularPoint);
      const peekLowerPoint = createLowerPoint(peekPoint, minorPoint);
      const glomerularLowerPoint = createLowerPoint(
        glomerularPoint,
        minorPoint
      );

      return [peekPoint, peekLowerPoint, glomerularLowerPoint, glomerularPoint];
    };

    const dataset = buildInteractionDataset(
      gPeekPoint,
      peekIndex,
      gGlomerularPoint,
      glomerularIndex
    );
    // create line
    const _line = line()
      .x(_parseInteractionXPoint(parseXPoint, transformedXAxisScale))
      .y(_parseInteractionYPoint(parseYPoint, transformedYAxisScale));

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
        gNodes,
        peekIndex,
        gNodes.length
      );

      movingPointsCallback(peekIndex, glomerularIndex);
    }
  };

  const mouseDownListener = (item, index, group) => {
    const peekIndex = index;
    const gPeekPoint = group[index];

    // do nothing in case current is an already placed peek point
    if (chart.interactionPoint.isPeekPoint(gPeekPoint)) {
      return;
    }

    // in case current is not a peek or glomerular place automatically p/g
    if (!chart.interactionPoint.isGlomerularPoint(gPeekPoint)) {
      const rootNode = root.node();
      const currentZoomTransform = zoomTransform(rootNode);

      const defaultTimecourseInterval = chart.interactionPoint.defaultInterval();
      let glomerularIndex = index + defaultTimecourseInterval;
      let gGlomerularPoint = group[glomerularIndex];

      if (!gGlomerularPoint) {
        glomerularIndex = group.length - 1;
        gGlomerularPoint = group[glomerularIndex];
      }

      placePoints(
        rootNode,
        currentZoomTransform,
        peekIndex,
        glomerularIndex,
        gPeekPoint,
        gGlomerularPoint
      );
    }
  };

  _removeListeners();
  _setListeners();
};

const bindMouseEvents = (
  root,
  gX,
  gY,
  xAxisScale,
  yAxisScale,
  xAxisGenerator,
  yAxisGenerator,
  parseXPoint,
  parseYPoint,
  dataset,
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
    xAxisScale,
    yAxisScale,
    parseXPoint,
    parseYPoint,
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
