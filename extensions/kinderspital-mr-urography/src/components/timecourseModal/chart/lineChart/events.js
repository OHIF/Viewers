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
      .x(parseInteractionXPoint(parseXPoint, transformedXAxisScale))
      .y(parseInteractionYPoint(parseYPoint, transformedYAxisScale));

    chart.interactionPoint.updateNode(root, undefined, _interactionline);
  }

  return _zoom;
};

const parseInteractionXPoint = (parseAxis, axisScale) => (
  interactionPoint,
  interactionIndex
) => {
  const { x: index, y } = interactionPoint;
  const point = {
    y,
  };
  return parseAxis(axisScale)(point, index);
};

const parseInteractionYPoint = (parseAxis, axisScale) => (
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

const _bindPointInteraction = (
  root,
  dataset,
  xAxisScale,
  yAxisScale,
  parseXPoint,
  parseYPoint,
  movingPointsCallback,
  defaultTimecourseInterval = 10
) => {
  const dots = root.selectAll('.dot');
  const gNodes = dots.nodes();

  const getCurrentGGlomerular = root => {
    return root.selectAll('.interaction.dot').filter('.glomerular');
  };

  const getCurrentGPeek = root => {
    return root.selectAll('.interaction.dot').filter('.peek');
  };

  const bisect = bisector(function(gPoint) {
    const gPointCx = gPoint.cx.baseVal.value;
    return gPointCx;
  }).left;

  function _setListeners() {
    dots.on('mousedown', mouseDownListener);
    const nextGGlomerularPoint = getCurrentGGlomerular(root);

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
    const gGlomerularPoint = getCurrentGGlomerular(root);

    if (gGlomerularPoint) {
      _removeDragListeners(gGlomerularPoint);
    }
    dots.on('mousedown', null);
  }
  const _setDragListeners = (
    rootNode,
    gElement,
    pathNodes,
    peekIndex = 0,
    nodesLength
  ) => {
    function _started() {
      select(this).classed('selected', true);
      let glomerularIndex;
      chart.interactionPoint.setLineHidden(root, true);
      event.on('drag', _dragged).on('end', _ended);
      function _dragged() {
        const mousePoint = mouse(this);
        const closestIndex = bisect(pathNodes, mousePoint[0], 1);

        if (closestIndex > peekIndex && closestIndex < nodesLength) {
          const selectedData = gNodes[closestIndex];
          if (selectedData) {
            chart.interactionPoint.setMoving(
              root,
              selectedData.id,
              'glomerular',
              true
            );

            glomerularIndex = closestIndex;
          }
        }
      }

      function _ended(a, b, c) {
        chart.interactionPoint.setLineHidden(root, false);

        const rootNode = root.node();
        const currentZoomTransform = zoomTransform(rootNode);
        const gPeekPoint = gNodes[peekIndex];
        const gGlomerularPoint = gNodes[glomerularIndex];

        chart.interactionPoint.setMoving(
          root,
          glomerularIndex,
          'glomerular',
          false
        );

        placePoints(
          rootNode,
          currentZoomTransform,
          peekIndex,
          glomerularIndex,
          gPeekPoint,
          gGlomerularPoint
        );
        select(this).classed('selected', false);
      }
    }

    const _drag = drag().on('start', _started);
    _drag.container(rootNode);
    gElement.call(_drag);
    gElement.classed('draggable', true);
  };

  const _removeDragListeners = gElement => {
    if (!gElement.empty()) {
      gElement.on('drag', null);
      gElement.classed('draggable', false);
    }
  };

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

    const currentGGlomerularPoint = getCurrentGGlomerular(root);
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
      .x(parseInteractionXPoint(parseXPoint, transformedXAxisScale))
      .y(parseInteractionYPoint(parseYPoint, transformedYAxisScale));

    chart.interactionPoint.addNode(
      root,
      gPeekPoint,
      gGlomerularPoint,
      dataset,
      _line
    );

    const nextGGlomerularPoint = getCurrentGGlomerular(root);

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
    const rootNode = root.node();
    const currentZoomTransform = zoomTransform(rootNode);

    const peekIndex = index;
    let glomerularIndex = index + defaultTimecourseInterval;
    const gPeekPoint = group[index];
    let gGlomerularPoint = group[glomerularIndex];

    if (!gGlomerularPoint) {
      glomerularIndex = group.length - 1;
      gGlomerularPoint = group[glomerularIndex];
    }

    const currentClassName = gPeekPoint.className.baseVal;

    if (currentClassName.indexOf('peek') > 0) {
      return;
    }

    if (currentClassName.indexOf('glomerular') < 0) {
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
  movingPointsCallback,
  defaultTimecourseInterval
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
    dataset,
    xAxisScale,
    yAxisScale,
    parseXPoint,
    parseYPoint,
    movingPointsCallback,
    defaultTimecourseInterval
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
