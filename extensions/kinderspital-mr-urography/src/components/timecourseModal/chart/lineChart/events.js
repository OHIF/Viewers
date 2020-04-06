import { zoom } from 'd3-zoom';
import { event } from 'd3-selection';
import { line } from 'd3-shape';
import { zoomIdentity, zoomTransform } from 'd3';

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

  _removeListernes();
  _setListeners();

  function _removeListernes() {
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
  parseYPoint
) => {
  const dots = root.selectAll('.dot');

  dots.on('mousedown', null);
  const mouseDown = (item, index, group) => {
    const rootNode = root.node();
    const currentZoomTransform = zoomTransform(rootNode);

    const peekIndex = index;
    const glomerularIndex = index + 10;
    const gPeekPoint = group[index];
    const gGlomerularPoint = group[index + 10];

    const transformedXAxisScale =
      (currentZoomTransform && currentZoomTransform.rescaleX(xAxisScale)) ||
      xAxisScale;
    const transformedYAxisScale =
      (currentZoomTransform && currentZoomTransform.rescaleY(yAxisScale)) ||
      yAxisScale;

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
  };
  dots.on('mousedown', mouseDown);
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
  dataset
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
    parseYPoint
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
